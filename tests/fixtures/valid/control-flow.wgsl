// Control flow statements
fn testControlFlow(x: i32) -> i32 {
    if (x > 0) {
        return 1;
    } else if (x < 0) {
        return -1;
    } else {
        return 0;
    }
}

fn testLoop() {
    for (var i: i32 = 0; i < 10; i = i + 1) {
        continue;
    }
    
    var j: i32 = 0;
    while (j < 5) {
        j = j + 1;
    }
    
    loop {
        if (j > 10) {
            break;
        }
        j = j + 1;
    }
}
