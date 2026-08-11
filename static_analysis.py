import asyncio
import os
import re
import subprocess
import tempfile
from typing import Dict, List, Tuple

# Try setting rlimit on Unix systems if available
try:
    import resource
    HAS_RLIMIT = True
except ImportError:
    HAS_RLIMIT = False


def _set_subprocess_limits():
    """Sets CPU and memory rlimits on Unix systems if available."""
    if HAS_RLIMIT:
        try:
            # Limit CPU time to 8 seconds
            resource.setrlimit(resource.RLIMIT_CPU, (8, 10))
            # Limit virtual memory to 256MB
            resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))
        except Exception:
            pass


async def _run_cmd_async(cmd: List[str], cwd: str, timeout: int = 10) -> Tuple[str, str]:
    """Runs a subprocess command asynchronously with timeout and safety resource limits."""
    try:
        kwargs = {}
        if HAS_RLIMIT and os.name != 'nt':
            kwargs['preexec_fn'] = _set_subprocess_limits

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            **kwargs
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            return stdout.decode('utf-8', errors='replace'), stderr.decode('utf-8', errors='replace')
        except asyncio.TimeoutError:
            try:
                proc.kill()
            except ProcessLookupError:
                pass
            return "", "Analysis timed out."
    except FileNotFoundError:
        return "", f"Tool not found: {cmd[0]}"
    except Exception as e:
        return "", f"Execution error: {str(e)}"


def parse_pylint(output: str) -> List[Dict[str, str]]:
    issues = []
    pattern = re.compile(r"[^:]+:(\d+):\d+:\s+([A-Z]\d+):\s+(.+)")
    sev_map = {"C": "convention", "R": "refactor", "W": "warning", "E": "error", "F": "fatal"}
    for line in output.splitlines():
        m = pattern.search(line)
        if m:
            code = m.group(2)
            severity = sev_map.get(code[0], "info")
            issues.append({"line": m.group(1), "severity": severity, "message": m.group(3).strip()})
    return issues


def parse_bandit(output: str) -> List[Dict[str, str]]:
    issues = []
    pattern = re.compile(
        r">> Issue: \[([^\]]+)\] (.+)\n\s+Severity: (\w+).+\n\s+Location: [^:]+:(\d+)",
        re.MULTILINE,
    )
    for m in pattern.finditer(output):
        issues.append({
            "line": m.group(4),
            "severity": m.group(3).lower(),
            "message": f"[Security] {m.group(2).strip()} ({m.group(1)})",
        })
    return issues


def parse_cpplint(stderr: str) -> List[Dict[str, str]]:
    issues = []
    pattern = re.compile(r"[^:]+:(\d+):\s+(.+)\s+\[([^\]]+)\]")
    for line in stderr.splitlines():
        m = pattern.search(line)
        if m:
            msg = m.group(2).strip()
            category = m.group(3)
            sev = "warning" if "legal" not in category else "info"
            issues.append({"line": m.group(1), "severity": sev, "message": f"{msg} [{category}]"})
    return issues


async def run_pylint_async(fpath: str, tmpdir: str) -> Tuple[List[Dict[str, str]], List[str]]:
    stdout, stderr = await _run_cmd_async(["pylint", "--output-format=text", "--score=no", fpath], cwd=tmpdir)
    if "Tool not found" in stderr or "Analysis timed out" in stderr:
        return [], [f"pylint unavailable: {stderr.strip()}"]
    return parse_pylint(stdout + stderr), []


async def run_bandit_async(fpath: str, tmpdir: str) -> Tuple[List[Dict[str, str]], List[str]]:
    stdout, stderr = await _run_cmd_async(["bandit", "-r", fpath, "--format", "text"], cwd=tmpdir)
    if "Tool not found" in stderr or "Analysis timed out" in stderr:
        return [], [f"bandit unavailable: {stderr.strip()}"]
    return parse_bandit(stdout + stderr), []


async def run_cpplint_async(fpath: str, tmpdir: str) -> Tuple[List[Dict[str, str]], List[str]]:
    stdout, stderr = await _run_cmd_async(["cpplint", "--filter=-legal/copyright", fpath], cwd=tmpdir)
    if "Tool not found" in stderr or "Analysis timed out" in stderr:
        return [], [f"cpplint unavailable: {stderr.strip()}"]
    return parse_cpplint(stdout + stderr), []


async def run_static_analysis_async(code: str, language: str) -> Tuple[List[Dict[str, str]], List[str]]:
    issues = []
    warnings = []
    with tempfile.TemporaryDirectory() as tmpdir:
        if language == "python":
            fpath = os.path.join(tmpdir, "submission.py")
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(code)

            # Concurrent async execution of pylint & bandit
            (pylint_issues, pylint_warns), (bandit_issues, bandit_warns) = await asyncio.gather(
                run_pylint_async(fpath, tmpdir),
                run_bandit_async(fpath, tmpdir)
            )
            issues.extend(pylint_issues)
            issues.extend(bandit_issues)
            warnings.extend(pylint_warns)
            warnings.extend(bandit_warns)
        elif language == "cpp":
            fpath = os.path.join(tmpdir, "submission.cpp")
            with open(fpath, "w", encoding="utf-8") as f:
                f.write(code)

            cpp_issues, cpp_warns = await run_cpplint_async(fpath, tmpdir)
            issues.extend(cpp_issues)
            warnings.extend(cpp_warns)

    return issues, warnings
