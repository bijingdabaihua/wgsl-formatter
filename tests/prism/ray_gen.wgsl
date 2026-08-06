// Ray Generation Pass — generates world-space rays for each pixel

struct CameraUniforms {
  invVP: mat4x4<f32>,
  cameraPos: vec4<f32>,
  resolution: vec4<f32>,
}

@group(0) @binding(0) var<uniform> cam: CameraUniforms;

// Output: ray origin (xyz) + direction (xyz) per pixel = 2 × vec4 = 8 floats
struct RayData {
  origin: vec4<f32>,
  dir: vec4<f32>,
}
@group(0) @binding(1) var<storage, read_write> rays: array<RayData>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let w = u32(cam.resolution.x);
  let h = u32(cam.resolution.y);
  if (id.x >= w || id.y >= h) { return; }

  let ndcX = (f32(id.x) + 0.5) / f32(w) * 2.0 - 1.0;
  let ndcY = (f32(id.y) + 0.5) / f32(h) * 2.0 - 1.0;

  let clip = vec4(ndcX, -ndcY, 1.0, 1.0);
  let world = cam.invVP * clip;
  let worldDir = normalize(world.xyz / world.w - cam.cameraPos.xyz);

  let idx = id.y * w + id.x;
  rays[idx].origin = vec4(cam.cameraPos.xyz, 1.0);
  rays[idx].dir = vec4(worldDir, 0.0);
}
