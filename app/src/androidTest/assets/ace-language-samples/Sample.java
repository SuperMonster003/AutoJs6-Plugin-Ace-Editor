// M1 Java highlighting sample
package sample;

import java.util.List;

public final class Greeter<T extends Number> {
    @Deprecated
    private final int count = 3;

    public String greet(String name) {
        List<String> values = List.of("Hello, " + name);
        return count > 0 ? values.get(0) : "";
    }
}
