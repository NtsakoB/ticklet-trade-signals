import ast
import pathlib

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
TARGET_DIRS = ["ticklet_ai"]

def iter_py_files():
    for td in TARGET_DIRS:
        for p in (PROJECT_ROOT / td).rglob("*.py"):
            yield p

class GlobalOrderVisitor(ast.NodeVisitor):
    def __init__(self):
        super().__init__()
        self.errors = []

    def visit_FunctionDef(self, node: ast.FunctionDef):
        # Map global name -> line number of its global declaration
        global_lines = {}
        for n in node.body:
            if isinstance(n, ast.Global):
                for name in n.names:
                    global_lines[name] = n.lineno
        if not global_lines:
            # No globals, nothing to check in this function
            return

        # Walk function body; record the first usage/assignment line per name
        first_use = {name: None for name in global_lines}
        class UseVisitor(ast.NodeVisitor):
            def __init__(self, tracked):
                self.tracked = set(tracked)
                self.first_use = {k: None for k in tracked}
            def _mark(self, name, lineno):
                if name in self.tracked and (self.first_use[name] is None or lineno < self.first_use[name]):
                    self.first_use[name] = lineno
            def visit_Name(self, n: ast.Name):
                self._mark(n.id, n.lineno)
            def visit_Assign(self, n: ast.Assign):
                for t in n.targets:
                    for nn in ast.walk(t):
                        if isinstance(nn, ast.Name):
                            self._mark(nn.id, n.lineno)
                self.generic_visit(n)
            def visit_AugAssign(self, n: ast.AugAssign):
                if isinstance(n.target, ast.Name):
                    self._mark(n.target.id, n.lineno)
                self.generic_visit(n)

        uv = UseVisitor(global_lines.keys())
        for n in node.body:
            uv.visit(n)

        # Compare use line vs global line
        for name, gline in global_lines.items():
            uline = uv.first_use[name]
            if uline is not None and uline < gline:
                self.errors.append(
                    f"{name} used on line {uline} before 'global' at line {gline} in function '{node.name}'"
                )

def test_global_declarations_before_usage():
    problems = []
    for path in iter_py_files():
        try:
            tree = ast.parse(path.read_text(), filename=str(path))
        except SyntaxError as e:
            problems.append(f"{path}: SyntaxError during parse: {e}")
            continue
        v = GlobalOrderVisitor()
        v.visit(tree)
        for msg in v.errors:
            problems.append(f"{path}: {msg}")
    assert not problems, "Global declaration order problems found:\n" + "\n".join(problems)