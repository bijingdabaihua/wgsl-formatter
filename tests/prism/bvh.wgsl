// BVH octree traversal — 8 child slots per node

fn traverseBVH(ray: Ray) -> BVHResult {
  var nodeBase: u32 = 0u;
  var tFar = 1e10;
  var hitT = -1.0; var hitU = 0.0; var hitV = 0.0; var hitTri: u32 = 0u;
  var stack = array<u32, 64>();
  var sp: u32 = 0u;
  var iter: u32 = 0u;

  loop {
    iter++;
    if (iter > 8192u || tFar < EPS) { break; }

    let base = nodeBase;
    let bmin = vec3(bvhNodes[base], bvhNodes[base+1u], bvhNodes[base+2u]);
    let bmax = vec3(bvhNodes[base+3u], bvhNodes[base+4u], bvhNodes[base+5u]);

    let slab = intersectAABB(ray, bmin, bmax, EPS, tFar);
    if (!slab.hit) {
      if (sp == 0u) { break; }
      sp--; nodeBase = stack[sp]; continue;
    }

    // 叶子：遍历三角面
    for (var s = 0u; s < 8u; s++) {
      let slot = bvhNodes[base + 6u + s];
      if (slot == 0.0) { continue; }
      if (slot < 0.0) {
        let tri = u32(-slot - 1.0);
        let hi = intersectTri(ray, tri);
        if (hi.t > EPS && hi.t < tFar) {
          tFar = hi.t; hitT = hi.t; hitU = hi.u; hitV = hi.v; hitTri = tri;
        }
      }
    }

    // 内部子节点入栈
    for (var s = 0u; s < 8u; s++) {
      let slot = bvhNodes[base + 6u + s];
      if (slot > 0.0) {
        stack[sp] = u32(slot - 1.0); sp++;
      }
    }

    if (sp == 0u) { break; }
    sp--; nodeBase = stack[sp];
  }

  return BVHResult(hitT, hitU, hitV, hitTri);
}
