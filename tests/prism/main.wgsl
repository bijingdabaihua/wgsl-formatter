// Main entry point — batched path tracing

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let w = u32(u.resolution.x);
  let h = u32(u.resolution.y);
  let start = u.batchOffset.x;
  let end = min(start + u.batchOffset.y, w * h);

  let globalIdx = start + id.x;
  if (globalIdx >= end) { return; }

  let pixelIdx = pixelIndices[globalIdx];
  let px = pixelIdx % w;
  let py = pixelIdx / w;
  let r = Ray(rays[pixelIdx].origin.xyz, rays[pixelIdx].dir.xyz);

  let res = traverseBVH(r);

  if (res.t > 0.0) {
    textureStore(outTex, vec2<i32>(i32(px), i32(py)), shade(r, res));
  } else {
    textureStore(outTex, vec2<i32>(i32(px), i32(py)), sampleEnv(r.rd));
  }
}
