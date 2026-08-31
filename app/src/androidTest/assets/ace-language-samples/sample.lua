-- M1 Lua highlighting sample
local count = 3

local function greet(name)
    local message = "Hello, " .. name
    if count > 0 then
        return message
    end
    return ""
end
