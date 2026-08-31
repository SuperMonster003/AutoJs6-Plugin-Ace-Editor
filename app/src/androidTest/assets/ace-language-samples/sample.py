# M1 Python highlighting sample
from dataclasses import dataclass

@dataclass
class Greeter:
    count: int = 3

    def greet(self, name: str) -> str:
        message = f"Hello, {name}"
        return message if self.count > 0 else ""
