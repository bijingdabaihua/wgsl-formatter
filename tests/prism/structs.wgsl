// Shared structs and bindings for path tracing

struct Uniforms {
  batchOffset: vec4<u32>,
  resolution: vec4<f32>,
}

struct RayData { origin: vec4<f32>, dir: vec4<f32> }

struct Ray { ro: vec3<f32>, rd: vec3<f32> }
struct TriHit { t: f32, u: f32, v: f32 }
struct BVHResult { t: f32, u: f32, v: f32, tri: u32 }

const EPS = 1e-6;

@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(1) var<storage, read> rays: array<RayData>;
@group(0) @binding(2) var<storage, read> bvhNodes: array<f32>;
@group(0) @binding(3) var<storage, read> geometry: array<f32>;
@group(0) @binding(4) var<storage, read> triangles: array<u32>;
@group(0) @binding(5) var<storage, read> materials: array<f32>;
@group(0) @binding(6) var outTex: texture_storage_2d<rgba8unorm, write>;
@group(0) @binding(7) var envTex: texture_2d<f32>;
@group(0) @binding(8) var<storage, read> pixelIndices: array<u32>;
