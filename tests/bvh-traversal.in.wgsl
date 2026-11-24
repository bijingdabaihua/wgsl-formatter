// BLAS BVH 遍历
fn traverse_blas(ray: Ray, blas_node_offset: u32) -> BVHResult {
var node_base: u32 = blas_node_offset; var t_far = 1e10; var hit_t = -1.0; var hit_u = 0.0; var hit_v = 0.0; var hit_triangle: u32 = 0u;
var stack = array<u32, 64>(); var sp: u32 = 0u; var iter: u32 = 0u;
loop { iter++; if (iter > 8192u || t_far < epsilon) { break; }
let base = node_base; let bmin = vec3(nodes[base], nodes[base+1u], nodes[base+2u]); let bmax = vec3(nodes[base+3u], nodes[base+4u], nodes[base+5u]);
let slab = intersect_aabb(ray, bmin, bmax, epsilon, t_far);
if (!slab.hit) { if (sp == 0u) { break; } sp--; node_base = stack[sp]; continue; }
for (var s = 0u; s < 2u; s++) { let slot = nodes[base + 6u + s]; if (slot == 0.0) { continue; }
if (slot < 0.0) { let tri = u32(-slot - 1.0); let hi = intersect_triangle(ray, tri);
if (hi.t > epsilon && hi.t < t_far) { t_far = hi.t; hit_t = hi.t; hit_u = hi.u; hit_v = hi.v; hit_triangle = tri; }
} else { stack[sp] = u32(slot - 1.0); sp++; } }
if (sp == 0u) { break; } sp--; node_base = stack[sp]; }
return BVHResult(hit_t, hit_u, hit_v, hit_triangle, 0u); }
// TLAS BVH 遍历
fn intersect_scene(ray: Ray) -> BVHResult {
var tlas_stack = array<u32, 64>(); var tlas_sp: u32 = 0u; tlas_stack[0] = 0u; tlas_sp++;
var best_t = -1.0; var best_u = 0.0; var best_v = 0.0; var best_triangle: u32 = 0u; var best_instance: u32 = 0u; var t_far = 1e10; var iter: u32 = 0u;
loop { iter++; if (iter > 8192u || tlas_sp == 0u) { break; } tlas_sp--; var node_base = tlas_stack[tlas_sp];
let base = node_base; let bmin = vec3(nodes[base], nodes[base+1u], nodes[base+2u]); let bmax = vec3(nodes[base+3u], nodes[base+4u], nodes[base+5u]);
let slab = intersect_aabb(ray, bmin, bmax, epsilon, t_far); if (!slab.hit) { continue; }
for (var s = 0u; s < 2u; s++) { let slot = nodes[base + 6u + s]; if (slot == 0.0) { continue; }
if (slot < 0.0) { let instance_id = u32(-slot - 1.0); let inst = instances[instance_id];
let local_origin = (inst.inv_transform * vec4(ray.origin, 1.0)).xyz;
let local_direction = (inst.inv_transform * vec4(ray.direction, 0.0)).xyz;
let local_ray = Ray(local_origin, local_direction);
let blas_hit = traverse_blas(local_ray, u32(inst.blas_node_offset));
if (blas_hit.t > epsilon && blas_hit.t < t_far) { t_far = blas_hit.t; best_t = blas_hit.t; best_u = blas_hit.u; best_v = blas_hit.v; best_triangle = blas_hit.triangle_index; best_instance = instance_id; }
} else { tlas_stack[tlas_sp] = u32(slot - 1.0); tlas_sp++; } } }
return BVHResult(best_t, best_u, best_v, best_triangle, best_instance); }
