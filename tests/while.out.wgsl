fn dec(x: f32) -> f32 {
    var v: f32 = x;
    while (v > 0.0) {
        v = v - 0.1;
    }
    return v;
}
