// Shading: base color + environment map reflection

fn sampleEnv(dir: vec3<f32>) -> vec4<f32> {
  let phi = atan2(dir.z, dir.x);
  let theta = acos(clamp(dir.y, -1.0, 1.0));
  let uv = vec2(phi / 6.2831853 + 0.5, 1.0 - theta / 3.14159265);
  let size = textureDimensions(envTex);
  let coord = vec2<i32>(uv * vec2<f32>(size));
  return textureLoad(envTex, coord, 0);
}

fn shade(ray: Ray, hit: BVHResult) -> vec4<f32> {
  let triIdx = hit.tri;
  let matIdx = triangles[triIdx * 7u + 6u];
  let o = matIdx * 16u;

  // Material properties
  let diffuse   = vec3(materials[o+4u], materials[o+5u], materials[o+6u]);
  let specular  = vec3(materials[o+8u], materials[o+9u], materials[o+10u]);
  let shininess = materials[o+11u];

  // Read triangle vertex normals
  let tOff = triIdx * 7u;
  let i0 = triangles[tOff];     let i1 = triangles[tOff+1u]; let i2 = triangles[tOff+2u];
  let n0 = readVertex(i0).nrm;
  let n1 = readVertex(i1).nrm;
  let n2 = readVertex(i2).nrm;

  // Interpolate normal using barycentric coordinates
  let w = 1.0 - hit.u - hit.v;
  let nrm = normalize(w * n0 + hit.u * n1 + hit.v * n2);

  // Ensure normal faces the incoming ray
  let facingNrm = select(-nrm, nrm, dot(nrm, -ray.rd) > 0.0);

  // Reflection direction
  let reflectDir = reflect(ray.rd, facingNrm);

  // Sample environment map
  let envColor = sampleEnv(reflectDir).rgb;

  // Specular intensity from material (0 = matte, 1 = mirror)
  let specIntensity = clamp(length(specular) * 0.5, 0.0, 1.0);

  // Simple Fresnel: grazing angles are more reflective
  let cosTheta = max(dot(-ray.rd, facingNrm), 0.0);
  let fresnel = pow(1.0 - cosTheta, 5.0) * 0.3;

  let reflectivity = specIntensity + (1.0 - specIntensity) * fresnel;

  let color = diffuse * (1.0 - reflectivity) + envColor * reflectivity;

  return vec4(color, 1.0);
}
