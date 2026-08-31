/*
 * Installation-only ABI marker for legacy 32-bit x86 Android devices.
 *
 * LuaLS is deliberately unsupported on x86. Android nevertheless rejects an APK containing
 * native libraries when it has no entry for the device ABI, before the editor can select its
 * static fallback. This dependency-free ELF makes the APK installable; product code never loads
 * or calls it, and x86 remains absent from the LuaLS runtime manifest.
 */
__attribute__((visibility("default")))
int autojs6_luals_x86_install_compatibility_marker(void) {
    return 1;
}
