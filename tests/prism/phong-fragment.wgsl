struct VertexOutput {
  @builtin(position) clipPos: vec4<f32>,
  @location(0) worldPos: vec3<f32>,
  @location(1) worldNormal: vec3<f32>,
  @location(2) uv: vec2<f32>,
}

struct SceneUniforms {
  viewProjection: mat4x4<f32>,
  model: mat4x4<f32>,
  normalMatrix: mat4x4<f32>,
  cameraPos: vec4<f32>,
  lightDir: vec4<f32>,
  lightColor: vec4<f32>,
  ambientColor: vec4<f32>,
  fillDir: vec4<f32>,
  fillColor: vec4<f32>,
}

struct MaterialUniforms {
  ambient: vec4<f32>,
  diffuse: vec4<f32>,
  specular: vec4<f32>,
  shininess: f32,
}

@group(0) @binding(0) var<uniform> scene: SceneUniforms;
@group(1) @binding(0) var<uniform> material: MaterialUniforms;

fn phongLight(N: vec3<f32>, V: vec3<f32>, L: vec3<f32>, lightCol: vec3<f32>) -> vec3<f32> {
  let NdotL = max(dot(N, L), 0.0);
  let diffuse = lightCol * material.diffuse.xyz * NdotL;

  let H = normalize(L + V);
  let NdotH = max(dot(N, H), 0.0);
  let specular = lightCol * material.specular.xyz * pow(NdotH, material.shininess);

  return diffuse + specular;
}

@fragment
fn main(input: VertexOutput) -> @location(0) vec4<f32> {
  let N = normalize(input.worldNormal);
  let V = normalize(scene.cameraPos.xyz - input.worldPos);

  // Ambient
  let ambient = scene.ambientColor.xyz * material.ambient.xyz;

  // Main directional light
  let L = normalize(scene.lightDir.xyz);
  let mainLight = phongLight(N, V, L, scene.lightColor.xyz);

  // Fill light from opposite side
  let fillL = normalize(scene.fillDir.xyz);
  let fillLight = phongLight(N, V, fillL, scene.fillColor.xyz);

  let color = ambient + mainLight + fillLight;

  let result = clamp(color, vec3<f32>(0.0), vec3<f32>(1.0));
  return vec4<f32>(result, 1.0);
}
