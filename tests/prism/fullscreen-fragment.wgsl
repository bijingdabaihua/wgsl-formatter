@group(0) @binding(0) var tex: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

@fragment
fn main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
  let dims = vec2<f32>(textureDimensions(tex));
  let uv = vec2(pos.x / dims.x, pos.y / dims.y);
  return textureSample(tex, samp, uv);
}
