// Ray-AABB intersection (slab test)

struct SlabResult { hit: bool, tNear: f32 }

fn intersectAABB(ray: Ray, bmin: vec3<f32>, bmax: vec3<f32>, tMin: f32, tMax: f32) -> SlabResult {
  var tn = tMin;
  var tf = tMax;

  // X slab
  if (abs(ray.rd.x) > 1e-12) {
    let id = 1.0 / ray.rd.x;
    var t0 = (bmin.x - ray.ro.x) * id;
    var t1 = (bmax.x - ray.ro.x) * id;
    if (id < 0.0) { let tmp = t0; t0 = t1; t1 = tmp; }
    tn = max(tn, t0); tf = min(tf, t1);
  } else if (ray.ro.x < bmin.x || ray.ro.x > bmax.x) {
    return SlabResult(false, tn);
  }

  // Y slab
  if (tn <= tf && abs(ray.rd.y) > 1e-12) {
    let id = 1.0 / ray.rd.y;
    var t0 = (bmin.y - ray.ro.y) * id;
    var t1 = (bmax.y - ray.ro.y) * id;
    if (id < 0.0) { let tmp = t0; t0 = t1; t1 = tmp; }
    tn = max(tn, t0); tf = min(tf, t1);
  } else if (tn <= tf && (ray.ro.y < bmin.y || ray.ro.y > bmax.y)) {
    return SlabResult(false, tn);
  }

  // Z slab
  if (tn <= tf && abs(ray.rd.z) > 1e-12) {
    let id = 1.0 / ray.rd.z;
    var t0 = (bmin.z - ray.ro.z) * id;
    var t1 = (bmax.z - ray.ro.z) * id;
    if (id < 0.0) { let tmp = t0; t0 = t1; t1 = tmp; }
    tn = max(tn, t0); tf = min(tf, t1);
  } else if (tn <= tf && (ray.ro.z < bmin.z || ray.ro.z > bmax.z)) {
    return SlabResult(false, tn);
  }

  return SlabResult(tn <= tf, tn);
}
