@file:Suppress("DEPRECATION")
package io.github.supermonster003.autojs6.plugin.ace.editor

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.IBinder
import android.os.Build
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.AndroidJUnit4
import org.autojs.plugin.common.api.PluginCapabilityKeys
import org.autojs.plugin.common.api.PluginInfo
import org.junit.Assert.*
import org.junit.Test
import org.junit.runner.RunWith
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class RepositoryContractInstrumentationTest {
    private val context = InstrumentationRegistry.getInstrumentation().targetContext

    @Test fun wakeIsPermissionProtectedDiscoverableAndResolvesMetadata() {
        val manager = context.packageManager
        val app = manager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
        val name = requireNotNull(app.metaData.getString("org.autojs.plugin.WAKE_ACTIVITY"))
        val component = ComponentName(context.packageName, if (name.startsWith('.')) context.packageName + name else name)
        val info = manager.getActivityInfo(component, 0)
        assertTrue(info.enabled); assertTrue(info.exported)
        assertEquals("org.autojs.permission.PLUGIN", info.permission)
        assertEquals(android.R.style.Theme_NoDisplay, info.theme)
        val resolved = manager.queryIntentActivities(Intent("org.autojs.plugin.action.WAKE")
            .addCategory(Intent.CATEGORY_DEFAULT).setPackage(context.packageName), 0)
        assertEquals(listOf(component.className), resolved.map { it.activityInfo.name })
    }

    @Test fun discoversExactServiceAndGetsInstalledMetadataOverRealBinder() {
        val intent = Intent("org.autojs.plugin.INFO").addCategory("ace-editor").setPackage(context.packageName)
        val services = context.packageManager.queryIntentServices(intent, 0)
        assertEquals(listOf("io.github.supermonster003.autojs6.plugin.ace.editor.AceEditorInfoService"), services.map { it.serviceInfo.name })
        val service = services.single().serviceInfo
        assertTrue(service.exported); assertEquals("org.autojs.permission.PLUGIN", service.permission)
        val connected = CountDownLatch(1)
        var binder: IBinder? = null
        val connection = object : ServiceConnection {
            override fun onServiceConnected(name: ComponentName, value: IBinder) { binder = value; connected.countDown() }
            override fun onServiceDisconnected(name: ComponentName) { binder = null }
        }
        assertTrue(context.bindService(Intent().setComponent(ComponentName(context.packageName, service.name)), connection, Context.BIND_AUTO_CREATE))
        try {
            assertTrue("Binder connection timed out", connected.await(10, TimeUnit.SECONDS))
            val remote = requireNotNull(binder)
            assertEquals("org.autojs.plugin.common.api.IPluginInfoProvider", remote.interfaceDescriptor)
            val stub = Class.forName("org.autojs.plugin.common.api.IPluginInfoProvider\$Stub")
            val api = stub.getMethod("asInterface", IBinder::class.java).invoke(null, remote)
            val info = Class.forName("org.autojs.plugin.common.api.IPluginInfoProvider").getMethod("getInfo").invoke(api) as PluginInfo
            val pkg = context.packageManager.getPackageInfo(context.packageName, 0)
            assertEquals(context.getString(R.string.app_name), info.name)
            assertEquals(context.getString(R.string.plugin_description), info.description)
            assertEquals(context.getString(R.string.plugin_author), info.author)
            assertEquals(BuildConfig.VERSION_DATE, info.versionDate)
            assertEquals(pkg.versionName, info.versionName)
            assertEquals(if (Build.VERSION.SDK_INT >= 28) pkg.longVersionCode else pkg.versionCode.toLong(), info.versionCode)
            assertEquals("ace-editor", info.id)
            assertEquals("editor", info.engine)
            assertEquals("ace", info.variant)
            assertTrue(info.supportedAbis.isNotEmpty())
            assertTrue(info.supportedAbis.all { it in setOf("arm64-v8a", "armeabi-v7a", "x86_64", "x86") })
            assertTrue((requireNotNull(info.capabilities).get(PluginCapabilityKeys.REQUIRES_HOST_VERSION) as Number).toLong() > 0)
            assertTrue(info.instruction?.isNotBlank() == true)
        } finally { context.unbindService(connection) }
    }
}
