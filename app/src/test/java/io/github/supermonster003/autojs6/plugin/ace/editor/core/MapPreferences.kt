package io.github.supermonster003.autojs6.plugin.ace.editor.core

import android.content.SharedPreferences

/** Read-only SharedPreferences backed by a map, for preference readers in JVM tests. */
internal class MapPreferences(vararg values: Pair<String, Any>) : SharedPreferences {
    private val values = mapOf(*values)

    override fun getAll(): Map<String, *> = values
    override fun getString(key: String?, defValue: String?) = values[key] as? String ?: defValue
    override fun getStringSet(key: String?, defValues: Set<String>?) = defValues
    override fun getInt(key: String?, defValue: Int) = values[key] as? Int ?: defValue
    override fun getLong(key: String?, defValue: Long) = values[key] as? Long ?: defValue
    override fun getFloat(key: String?, defValue: Float) = values[key] as? Float ?: defValue
    override fun getBoolean(key: String?, defValue: Boolean) = values[key] as? Boolean ?: defValue
    override fun contains(key: String?) = values.containsKey(key)
    override fun edit(): SharedPreferences.Editor = throw UnsupportedOperationException()
    override fun registerOnSharedPreferenceChangeListener(
        listener: SharedPreferences.OnSharedPreferenceChangeListener?,
    ) = Unit
    override fun unregisterOnSharedPreferenceChangeListener(
        listener: SharedPreferences.OnSharedPreferenceChangeListener?,
    ) = Unit
}
