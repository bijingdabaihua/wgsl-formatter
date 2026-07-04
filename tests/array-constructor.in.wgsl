@vertex
fn main(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4<f32> {
  let pos = array(
    vec2(-1.0, -1.0),
    vec2( 3.0, -1.0),
    vec2(-1.0,  3.0),
  );
  return vec4(pos[vi], 0.0, 1.0);
}
