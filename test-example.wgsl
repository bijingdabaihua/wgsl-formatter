// 测试文件 - 格式化前的混乱代码

fn main(){let x=1+2;let y=x*3;return y;}

struct VertexInput{
@location(0) position:vec3<f32>,
@location(1) normal:vec3<f32>,
@location(2) uv:vec2<f32>,
}

struct VertexOutput{
@builtin(position) clip_position:vec4<f32>,
@location(0) world_position:vec3<f32>,
@location(1) world_normal:vec3<f32>,
}

@vertex
fn vs_main(input:VertexInput)->VertexOutput{
var output:VertexOutput;
output.clip_position=vec4<f32>(input.position,1.0);
output.world_position=input.position;
output.world_normal=input.normal;
return output;
}

fn computeShading(position:vec3<f32>,normal:vec3<f32>,lightDir:vec3<f32>,viewDir:vec3<f32>)->vec3<f32>{
let diffuse=max(dot(normal,lightDir),0.0);
let halfDir=normalize(lightDir+viewDir);
let specular=pow(max(dot(normal,halfDir),0.0),32.0);
return vec3<f32>(diffuse)+vec3<f32>(specular);
}

@fragment
fn fs_main(input:VertexOutput)->@location(0) vec4<f32>{
let lightDir=normalize(vec3<f32>(1.0,1.0,1.0));
let viewDir=normalize(-input.world_position);
let color=computeShading(input.world_position,input.world_normal,lightDir,viewDir);
return vec4<f32>(color,1.0);
}
