# -*- coding: utf-8 -*-
CHECK_MODE = False
CHECK_ERRORS = []
GENERATED_PATHS = set()

import json
import re
import unicodedata
import xml.etree.ElementTree as ElementTree
from pathlib import Path


LANGUAGE_CODES = [
    "zh-Hans",
    "zh-Hant-HK",
    "zh-Hant-TW",
    "en",
    "fr",
    "es",
    "ja",
    "ko",
    "ru",
    "ar",
]
LANGUAGE_CODE_DEFAULT = "zh-Hans"
ANDROID_CHANGELOG_ALIASES = {
    "zh-Hans": ["zh", "zh-Hans"],
    "zh-Hant-HK": ["zh-rHK", "zh-Hant-HK"],
    "zh-Hant-TW": ["zh-rTW", "zh-Hant-TW"],
}
ANDROID_STRING_DIRECTORIES = {
    "zh-Hans": "values-zh",
    "zh-Hant-HK": "values-zh-rHK",
    "zh-Hant-TW": "values-zh-rTW",
    "en": "values-en",
    "fr": "values-fr",
    "es": "values-es",
    "ja": "values-ja",
    "ko": "values-ko",
    "ru": "values-ru",
    "ar": "values-ar",
}
CHANGELOG_CATEGORIES = ["hint", "feature", "fix", "improvement", "dependency"]


def project_root() -> Path:
    return Path(__file__).resolve().parents[1]


ROOT = project_root()
README_DIR = ROOT / ".readme"
CHANGELOG_DIR = ROOT / ".changelog"
ANDROID_CHANGELOG_DIR = ROOT / "app" / "src" / "main" / "assets" / "doc"
VERSION_PROPERTIES = ROOT / "version.properties"


def relative_path(path: Path) -> Path:
    return path.relative_to(ROOT)


def validate_no_fullwidth_symbols(path: Path, text: str):
    for line_number, line in enumerate(text.splitlines(), start=1):
        for column_number, char in enumerate(line, start=1):
            category = unicodedata.category(char)
            width = unicodedata.east_asian_width(char)
            if width in {"F", "W"} and category[0] in {"P", "S", "Z"}:
                raise ValueError(
                    f"Fullwidth symbol {char!r} at "
                    f"{relative_path(path)}:{line_number}:{column_number}"
                )


def load_json(path: Path):
    text = path.read_text(encoding="utf-8")
    validate_no_fullwidth_symbols(path, text)
    return json.loads(text)


def render_template(text: str, values: dict) -> str:
    def repl(match):
        key = match.group(1).strip()
        if key not in values:
            raise KeyError(f"Missing template value: {key}")
        return str(values[key])

    return re.sub(r"\{\{\s*([A-Za-z0-9_$.-]+)\s*\}\}", repl, text)


def render_dynamic(value, values: dict):
    if isinstance(value, dict):
        return {key: render_dynamic(item, values) for key, item in value.items()}
    if isinstance(value, list):
        return [render_dynamic(item, values) for item in value]
    if isinstance(value, str):
        return render_template(value, values)
    return value


def bullet_list(items):
    return "\n".join(f"- {item}" for item in items)


def markdown_link(label, url):
    return f"[{label}]({url})"


def version_label() -> str:
    properties = {}
    for raw_line in VERSION_PROPERTIES.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        properties[key.strip()] = value.strip()
    version_name = properties.get("VERSION_NAME")
    if not version_name:
        raise ValueError("VERSION_NAME is missing from version.properties")
    return version_name if version_name.startswith("v") else f"v{version_name}"


def validate_key_parity(items: dict, kind: str):
    base_code = LANGUAGE_CODE_DEFAULT
    base_keys = set(items[base_code])
    for code, item in items.items():
        keys = set(item)
        if keys != base_keys:
            missing = sorted(base_keys - keys)
            extra = sorted(keys - base_keys)
            raise ValueError(
                f"{kind} key mismatch for {code}: missing={missing}, extra={extra}"
            )


def validate_collection_shapes(items: dict, kind: str):
    base_item = items[LANGUAGE_CODE_DEFAULT]
    for code, item in items.items():
        for key, base_value in base_item.items():
            value = item[key]
            if type(value) is not type(base_value):
                raise TypeError(
                    f"{kind} value type mismatch for {code}.{key}: "
                    f"expected={type(base_value).__name__}, got={type(value).__name__}"
                )
            if isinstance(base_value, list) and len(value) != len(base_value):
                raise ValueError(
                    f"{kind} list length mismatch for {code}.{key}: "
                    f"expected={len(base_value)}, got={len(value)}"
                )


def validate_changelog_shapes(changelogs: dict):
    base_data = changelogs[LANGUAGE_CODE_DEFAULT]["$data"]
    base_versions = list(base_data)
    allowed_keys = {"released_date", *CHANGELOG_CATEGORIES}
    for code, changelog in changelogs.items():
        data = changelog["$data"]
        versions = list(data)
        if versions != base_versions:
            raise ValueError(f"Changelog version mismatch for {code}: {versions}")
        for release_version, base_release in base_data.items():
            release = data[release_version]
            unknown = sorted(set(release) - allowed_keys)
            if unknown:
                raise ValueError(
                    f"Unknown changelog fields for {code}.{release_version}: {unknown}"
                )
            if set(release) != set(base_release):
                missing = sorted(set(base_release) - set(release))
                extra = sorted(set(release) - set(base_release))
                raise ValueError(
                    f"Changelog shape mismatch for {code}.{release_version}: "
                    f"missing={missing}, extra={extra}"
                )
            for key, base_value in base_release.items():
                value = release[key]
                if type(value) is not type(base_value):
                    raise TypeError(
                        f"Changelog value type mismatch for "
                        f"{code}.{release_version}.{key}"
                    )
                if isinstance(base_value, list) and len(value) != len(base_value):
                    raise ValueError(
                        f"Changelog list length mismatch for "
                        f"{code}.{release_version}.{key}: "
                        f"expected={len(base_value)}, got={len(value)}"
                    )


def load_languages():
    common = load_json(README_DIR / "common.json")
    raw_languages = {
        code: load_json(README_DIR / f"lang_{code}.json") for code in LANGUAGE_CODES
    }
    raw_changelogs = {
        code: load_json(CHANGELOG_DIR / f"lang_{code}.json") for code in LANGUAGE_CODES
    }
    validate_key_parity(raw_languages, "README")
    validate_key_parity(raw_changelogs, "changelog")
    validate_collection_shapes(raw_languages, "README")
    validate_collection_shapes(raw_changelogs, "changelog")
    validate_changelog_shapes(raw_changelogs)

    expected_version = version_label()
    base_versions = list(raw_changelogs[LANGUAGE_CODE_DEFAULT]["$data"])
    if not base_versions or base_versions[0] != expected_version:
        raise ValueError(
            f"Latest changelog version must be {expected_version!r}, got {base_versions[:1]}"
        )

    languages = {}
    changelogs = {}
    for code in LANGUAGE_CODES:
        merged_language = {**common, **raw_languages[code]}
        languages[code] = render_dynamic(merged_language, merged_language)

        raw_changelog = raw_changelogs[code]
        changelog_values = {
            key: value for key, value in raw_changelog.items() if key != "$data"
        }
        changelog_values = render_dynamic(changelog_values, changelog_values)
        changelog_data = render_dynamic(raw_changelog["$data"], changelog_values)
        changelogs[code] = {"values": changelog_values, "data": changelog_data}
    return languages, changelogs


def format_changelog_items(changelog, limit=None):
    values = changelog["values"]
    data = changelog["data"]
    chunks = []
    for index, (release_version, item) in enumerate(data.items()):
        if limit is not None and index >= limit:
            break
        lines = [f"# {release_version}", "", f"###### {item['released_date']}", ""]
        for category in CHANGELOG_CATEGORIES:
            for entry in item.get(category, []):
                label = values[f"changelog_label_{category}"]
                lines.append(f"* `{label}` {entry}")
        chunks.append("\n".join(lines).rstrip())
    return "\n\n".join(chunks).rstrip() + "\n"


def build_language_list(target_code, languages):
    lines = []
    repo_url = languages[target_code]["repo_url"]
    for code in LANGUAGE_CODES:
        content = languages[code]
        label = f"{content['$name']} [{code}]"
        if code == target_code:
            lines.append(f"- {label} # {content['text_current_lowercase']}")
        else:
            url = f"{repo_url}/blob/master/.readme/README-{code}.md"
            lines.append(f"- {markdown_link(label, url)}")
    return "\n".join(lines)


def build_readme_values(code, languages, changelogs):
    content = dict(languages[code])
    content["version_name"] = version_label().removeprefix("v")
    content["placeholder_ul_languages_all_supported"] = build_language_list(
        code, languages
    )
    content["placeholder_features"] = bullet_list(content["features"])
    content["placeholder_latest_release_history"] = format_changelog_items(
        changelogs[code], limit=3
    ).rstrip()
    content["placeholder_read_more_in_changelog_md"] = markdown_link(
        "CHANGELOG.md",
        f"{content['repo_url']}/blob/master/app/src/main/assets/doc/CHANGELOG-{code}.md",
    )
    return content


def write_text(path: Path, text: str):
    GENERATED_PATHS.add(path)
    if CHECK_MODE:
        if not path.is_file() or path.read_bytes() != text.encode("utf-8"):
            CHECK_ERRORS.append(str(path.relative_to(ROOT)))
        return
    validate_no_fullwidth_symbols(path, text)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")
    print(f"Generated {relative_path(path)}")


def generate_readmes(languages, changelogs):
    template_path = README_DIR / "template_readme.md"
    template = template_path.read_text(encoding="utf-8")
    validate_no_fullwidth_symbols(template_path, template)
    for code in LANGUAGE_CODES:
        output = render_template(
            template, build_readme_values(code, languages, changelogs)
        )
        write_text(README_DIR / f"README-{code}.md", output)
        if code == LANGUAGE_CODE_DEFAULT:
            write_text(ROOT / "README.md", output)


def generate_changelogs(languages, changelogs):
    template_path = CHANGELOG_DIR / "template_changelog.md"
    template = template_path.read_text(encoding="utf-8")
    validate_no_fullwidth_symbols(template_path, template)
    for code in LANGUAGE_CODES:
        values = dict(languages[code])
        values["placeholder_release_history"] = format_changelog_items(
            changelogs[code]
        ).rstrip()
        output = render_template(template, values)
        names = ANDROID_CHANGELOG_ALIASES.get(code, [code])
        for name in names:
            write_text(ANDROID_CHANGELOG_DIR / f"CHANGELOG-{name}.md", output)
        if code == LANGUAGE_CODE_DEFAULT:
            write_text(ANDROID_CHANGELOG_DIR / "CHANGELOG.md", output)


def validate_localized_resources():
    resource_root = ROOT / "app" / "src" / "main" / "res"
    resource_files = [resource_root / "values" / "strings.xml"] + [
        resource_root / ANDROID_STRING_DIRECTORIES[code] / "strings.xml"
        for code in LANGUAGE_CODES
    ]
    resource_keys = {}
    for path in resource_files:
        text = path.read_text(encoding="utf-8")
        validate_no_fullwidth_symbols(path, text)
        strings = {
            element.attrib["name"]: "".join(element.itertext())
            for element in ElementTree.fromstring(text).findall("string")
        }
        resource_keys[path] = set(strings)
        description = strings.get("plugin_description")
        if description is None:
            raise ValueError(f"plugin_description is missing from {relative_path(path)}")
        if description.rstrip().endswith("."):
            raise ValueError(
                f"plugin_description must not end with a period in {relative_path(path)}"
            )

    default_path = ROOT / "app" / "src" / "main" / "res" / "values" / "strings.xml"
    default_keys = resource_keys[default_path]
    for path, keys in resource_keys.items():
        if keys != default_keys:
            missing = sorted(default_keys - keys)
            extra = sorted(keys - default_keys)
            raise ValueError(
                f"Android string key mismatch for {relative_path(path)}: "
                f"missing={missing}, extra={extra}"
            )


def main():
    if LANGUAGE_CODE_DEFAULT not in LANGUAGE_CODES:
        raise ValueError(
            f"Default language code {LANGUAGE_CODE_DEFAULT!r} is not in LANGUAGE_CODES"
        )
    if (ROOT / "CHANGELOG.md").exists():
        raise ValueError(
            "Root CHANGELOG.md is not allowed; use app/src/main/assets/doc outputs"
        )
    validate_localized_resources()
    languages, changelogs = load_languages()
    generate_changelogs(languages, changelogs)
    generate_readmes(languages, changelogs)



def validate_release_sources():
    import xml.etree.ElementTree as ET
    version_text = (ROOT / "version.properties").read_text(encoding="utf-8-sig")
    version = re.search(r"(?m)^VERSION_NAME=(.+)$", version_text).group(1).strip().split("-")[0]
    shape = None
    for code in LANGUAGE_CODES:
        path = CHANGELOG_DIR / f"lang_{code}.json"
        data = json.loads(path.read_text(encoding="utf-8"))["$data"]
        if next(iter(data)) != f"v{version}":
            raise ValueError(f"Current changelog version mismatch: {path}")
        latest = data[f"v{version}"]
        actual = [(key, len(value) if isinstance(value, list) else value) for key, value in latest.items()]
        if shape is None:
            shape = actual
        elif actual != shape:
            raise ValueError(f"Current changelog language shape mismatch: {path}")
    res = ROOT / "app/src/main/res"
    qualifiers = ["", "en", "ar", "es", "fr", "ja", "ko", "ru", "zh", "zh-rHK", "zh-rTW"]
    reference = None
    for qualifier in qualifiers:
        path = res / ("values" + ("-" + qualifier if qualifier else "")) / "strings.xml"
        entries = {item.attrib["name"]: "".join(item.itertext()) for item in ET.parse(path).getroot() if item.tag == "string"}
        if "plugin_description" not in entries:
            raise ValueError(f"Missing localized plugin description: {path}")
        if list(entries) != sorted(entries):
            raise ValueError(f"Unsorted strings: {path}")
        if reference is None:
            reference = entries
        elif qualifier == "en" and any(value != reference[name] for name, value in entries.items() if name in reference):
            raise ValueError("Default and explicit English strings differ")


def cli():
    import argparse
    global CHECK_MODE
    parser = argparse.ArgumentParser(description="Generate localized documentation or check it without writing")
    parser.add_argument("--check", action="store_true")
    CHECK_MODE = parser.parse_args().check
    validate_release_sources()
    main()
    if CHECK_ERRORS:
        raise SystemExit("Generated documentation differs: " + ", ".join(CHECK_ERRORS))
    print(f"{'Checked' if CHECK_MODE else 'Generated'} {len(GENERATED_PATHS)} documentation artifacts")


if __name__ == "__main__":
    cli()
