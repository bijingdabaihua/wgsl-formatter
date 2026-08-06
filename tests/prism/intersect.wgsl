// Möller–Trumbore with indexed geometry

struct VertexData { pos: vec3<f32>, nrm: vec3<f32> }

fn readVertex(vertIdx: u32) -> VertexData {
  let gOff = vertIdx * 6u;
  return VertexData(
    vec3(geometry[gOff], geometry[gOff+1u], geometry[gOff+2u]),
    vec3(geometry[gOff+3u], geometry[gOff+4u], geometry[gOff+5u]),
  );
}

fn intersectTri(ray: Ray, triIdx: u32) -> TriHit {
  let tOff = triIdx * 7u;
  let i0 = triangles[tOff];     let i1 = triangles[tOff + 1u]; let i2 = triangles[tOff + 2u];

  let a = readVertex(i0).pos;
  let b = readVertex(i1).pos;
  let c = readVertex(i2).pos;

  let e1 = b - a; let e2 = c - a;
  let pVec = cross(ray.rd, e2);
  let det = dot(e1, pVec);
  if (abs(det) < 1e-12) { return TriHit(-1.0, 0.0, 0.0); }
  let invDet = 1.0 / det;
  let tVec = ray.ro - a;
  let u = dot(tVec, pVec) * invDet;
  if (u < 0.0 || u > 1.0) { return TriHit(-1.0, 0.0, 0.0); }
  let qVec = cross(tVec, e1);
  let v = dot(ray.rd, qVec) * invDet;
  if (v < 0.0 || u + v > 1.0) { return TriHit(-1.0, 0.0, 0.0); }
  let t = dot(e2, qVec) * invDet;
  if (t < EPS || t > 1e10) { return TriHit(-1.0, 0.0, 0.0); }
  return TriHit(t, u, v);
}
