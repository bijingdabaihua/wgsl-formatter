// Variable declarations
var<private> globalVar: f32 = 1.0;
var<workgroup> sharedData: array<f32, 256>;

fn testVariables() {
    var localVar: i32 = 42;
    let constValue: f32 = 3.14159;
    var vec: vec3<f32> = vec3<f32>(1.0, 2.0, 3.0);
}
