package io.github.supermonster003.autojs6.plugin.ace.editor

import android.app.Service
import android.content.Intent
import android.content.pm.PackageInfo
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import org.autojs.plugin.common.api.IPluginInfoProvider
import org.autojs.plugin.common.api.PluginCapabilityKeys
import org.autojs.plugin.common.api.PluginInfo

class AceEditorInfoService : Service() {

    override fun onBind(intent: Intent?): IBinder = binder

    private val binder = object : IPluginInfoProvider.Stub() {
        override fun getInfo(): PluginInfo {
            val packageInfo = packageManager.getPackageInfo(packageName, 0)
            return PluginInfo().apply {
                name = getString(R.string.app_name)
                description = getString(R.string.plugin_description)
                instruction = getString(R.string.plugin_instruction)
                author = getString(R.string.plugin_author)
                versionName = packageInfo.versionName.orEmpty()
                versionCode = packageInfo.versionCodeCompat()
                versionDate = BuildConfig.VERSION_DATE
                id = AceEditorMetadata.PLUGIN_ID
                engine = AceEditorMetadata.ENGINE
                variant = AceEditorMetadata.VARIANT
                supportedAbis = emptyArray()
                capabilities = Bundle().apply {
                    putInt(PluginCapabilityKeys.REQUIRES_HOST_VERSION, REQUIRED_HOST_VERSION_CODE)
                    putInt(AceEditorMetadata.CAPABILITY_CONTRACT_VERSION, AceEditorMetadata.CONTRACT_VERSION)
                    AceEditorMetadata.CAPABILITIES.forEach { putBoolean(it, true) }
                }
            }
        }
    }

    private fun PackageInfo.versionCodeCompat(): Long {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) return longVersionCode
        @Suppress("DEPRECATION")
        return versionCode.toLong()
    }

    private companion object {
        const val REQUIRED_HOST_VERSION_CODE = AceEditorMetadata.REQUIRED_HOST_VERSION_CODE
    }
}
