// Legacy AutoJs6 namespace aliases retained for editor compatibility.
//
// Current declarations provide RootMode, Internal.Autojs, and the global App
// namespace directly. Do not redeclare them here: doing so creates duplicate
// identifiers when this compatibility root is loaded with the generated core.

declare namespace AutoJs6 {
    namespace App {
        type PackageName = string;
        type AppName = string;
        type Alias = string;
    }
}
