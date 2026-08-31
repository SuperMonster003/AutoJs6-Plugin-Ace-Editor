// M1 Kotlin highlighting sample
package sample

data class Greeter<T : Number>(val count: Int = 3) {
    fun greet(name: String): String {
        val message = "Hello, $name"
        return if (count > 0) message else ""
    }
}
