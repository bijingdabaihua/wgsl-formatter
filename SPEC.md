# WGSL Formatter Specification v2.0

> **本文档是所有格式化决策的权威来源。**
> 每个规则都有唯一的编号，可以直接映射到测试用例。
> 格式: `input → output`

---

## R1 缩进 (Indentation)

### R1.1 基本缩进单元
- 默认: 4 个空格 (`indentSize: 4`)
- 可配置: 1-8 个空格
- Tab 模式: `useTabs: true` 时用 Tab 替代空格

### R1.2 缩进层级规则
所有 `{ }` 包围的块体内部增加一级缩进：
- 函数体、结构体体、控制流体（if/else/for/while/loop/switch）
- 换行后的函数参数（continuation indent）

```
// Input:
fn main(){
return;
if(true){
if(false){
return;
}
}
}

// Output:
fn main() {
    return;
    if (true) {
        if (false) {
            return;
        }
    }
}
```

### R1.3 空函数体
```
// Input:
fn empty(){}

// Output:
fn empty() {
}
```

---

## R2 括号风格 (Brace Style)

### R2.1 左大括号位置 (OTBS)
左大括号放在行末，右大括号独占一行：
- 函数: `fn name(params) {`
- 结构体: `struct Name {`
- 控制流: `if (cond) {`, `else {`, `for (...) {`, `while (cond) {`, `loop {`, `switch (expr) {`

```
// Input:
fn main()
{
return;
}

// Output:
fn main() {
    return;
}
```

### R2.2 else/else if 位置
`else` 和 `else if` 放在右大括号后，与 `}` 在同一行：

```
// Input:
fn test(x: i32) -> i32 {
    if (x > 0) {
        return 1;
    }
    else
    {
        return 0;
    }
}

// Output:
fn test(x: i32) -> i32 {
    if (x > 0) {
        return 1;
    } else {
        return 0;
    }
}
```

### R2.3 else if 链
```
// Input:
if(x>10){return 1;}else if(x>5){return 2;}else{return 3;}

// Output:
fn example(x: i32) -> i32 {
    if (x > 10) {
        return 1;
    } else if (x > 5) {
        return 2;
    } else {
        return 3;
    }
}
```

---

## R3 语句分隔 (Statement Separation)

### R3.1 每个声明独占一行
```
// Input:
struct A{}struct B{}
fn a(){return;}fn b(){return;}

// Output:
struct A {
}
struct B {
}
fn a() {
    return;
}
fn b() {
    return;
}
```

### R3.2 每个语句独占一行
```
// Input:
fn main(){var x:f32=1.0;var y:f32=2.0;return x+y;}

// Output:
fn main() {
    var x: f32 = 1.0;
    var y: f32 = 2.0;
    return x + y;
}
```

---

## R4 间距 (Spacing)

### R4.1 二元运算符间距
所有二元运算符前后各加 1 个空格。

覆盖的运算符：
`+` `-` `*` `/` `%` `=` `==` `!=` `<` `>` `<=` `>=` `&&` `||`
`&` `|` `^` `<<` `>>` `+=` `-=` `*=` `/=` `%=` `&=` `|=` `^=` `<<=` `>>=`

```
// Input:
var x:f32=a+b*c;
var eq:bool=a==b;
var and:bool=a&&b;
var or:i32=a|b;

// Output:
var x: f32 = a + b * c;
var eq: bool = a == b;
var and: bool = a && b;
var or: i32 = a | b;
```

#### R4.1a 例外：一元运算符
一元运算符与操作数之间无空格：`!` `-`(负号) `~`

```
// Input:
var neg: f32 = -value;
var not: bool = !flag;

// Output:
var neg: f32 = -value;
var not: bool = !flag;
```

### R4.2 逗号后空格
逗号后加 1 个空格，逗号前无空格。

```
// Input:
fn foo(a:f32,b:i32)
vec4<f32>(1.0,2.0,3.0)

// Output:
fn foo(a: f32, b: i32)
vec4<f32>(1.0, 2.0, 3.0)
```

### R4.3 分号
语句结尾加分号，分号前无空格，分号后换行。

```
// Input:
var x: f32 = 1.0 ; return x

// Output:
var x: f32 = 1.0;
return x;
```

### R4.4 类型注解冒号
冒号前无空格，冒号后加 1 个空格。

```
// Input:
var x : f32= 1.0;
fn foo(a :i32)->f32

// Output:
var x: f32 = 1.0;
fn foo(a: i32) -> f32
```

### R4.5 返回类型箭头
`->` 前后各加 1 个空格。

```
// Input:
fn main()->f32{return 1.0;}
fn main() ->f32{return 1.0;}

// Output:
fn main() -> f32 {
    return 1.0;
}
```

### R4.6 关键字后的空格
关键字与后面的 `(` 或表达式之间加 1 个空格。
覆盖: `fn` `struct` `var` `let` `const` `return` `if` `else` `for` `while` `switch` `loop` `override` `alias` `enable`

```
// Input:
fn main(){if(x>0){return 1;}}

// Output:
fn main() {
    if (x > 0) {
        return 1;
    }
}
```

### R4.7 函数调用/声明括号
函数名与 `(` 之间无空格。`(` 与 `)` 内部无前导/尾随空格。

```
// Input:
fn foo (a:f32, b:i32)
vec4<f32> (1.0, 2.0)

// Output:
fn foo(a: f32, b: i32)
vec4<f32>(1.0, 2.0)
```

### R4.8 `)` 与 `{` 之间
`){` 之间加 1 个空格。

```
// Input:
fn main(){if(true){return;}}

// Output:
fn main() {
    if (true) {
        return;
    }
}
```

### R4.9 属性 `@`
`@` 与属性名之间无空格。多个属性各占一行。

```
// Input:
@ group(0) @ binding(0) var<uniform> u: Uniforms;

// Output:
@group(0)
@binding(0)
var<uniform> u: Uniforms;
```

### R4.10 函数参数列表逗号
参数列表中逗号后加空格，逗号前无空格。

```
// Input:
fn interpolate(a:f32,b:f32,t:f32)->f32

// Output:
fn interpolate(a: f32, b: f32, t: f32) -> f32
```

---

## R5 对齐 (Alignment)

### R5.1 结构体字段对齐
结构体字段的类型名部分按最长字段名右对齐。`:` 后至少有 1 个空格。

```
// Input:
struct Light{direction:vec3<f32>,color:vec3<f32>,intensity:f32,shadowBias:f32,}

// Output:
struct Light {
    direction:  vec3<f32>,
    color:      vec3<f32>,
    intensity:  f32,
    shadowBias: f32,
}
```

对齐计算：
- `shadowBias:` = 11 字符（最长）
- 对齐列 = 11 + 1 = 12
- `direction: ` (10) + padding(2) → `direction:  vec3<f32>`
- `shadowBias:` (11) + padding(1) → `shadowBias: f32`

### R5.2 带属性的字段对齐
属性名称计入字段名的长度计算。

```
// Input:
struct Input{@location(0)pos:vec3<f32>,@location(1)normal:vec3<f32>,}

// Output:
struct Input {
    @location(0) pos: vec3<f32>,
    @location(1) pos: vec3<f32>,
}
```

对齐计算：
- `@location(0) pos:` = 17 字符
- `@location(1) pos:` = 17 字符
- 对齐列 = 17 + 1 = 18

### R5.3 多行函数参数对齐
当函数参数换行时，参数从左括号后一列开始对齐。

```
// Input:
fn createMaterial(diffuseTexture:texture_2d<f32>,normalMap:texture_2d<f32>,roughness:f32,metalness:f32)->Material

// Output (当签名长度 > maxLineLength):
fn createMaterial(
    diffuseTexture: texture_2d<f32>,
    normalMap:      texture_2d<f32>,
    roughness:      f32,
    metalness:      f32,
) -> Material {
```

对齐计算：
- `diffuseTexture:` = 15 字符（最长）
- 对齐列 = 15 + 1 = 16

---

## R6 换行 (Line Wrapping)

### R6.1 最大行长度
默认 100 字符（可配置 40-200）。超长的行应尝试换行。

### R6.2 函数签名换行
超过最大长度时：
1. 每个参数独占一行
2. 参数增加一级缩进
3. 右括号和返回类型在独立行

```
// Input (假设 maxLineLength=60):
fn createRenderPipeline(device:Device,shaderModule:ShaderModule,vertexLayout:VertexBufferLayout) -> RenderPipeline { return pipeline; }

// Output:
fn createRenderPipeline(
    device:        Device,
    shaderModule:  ShaderModule,
    vertexLayout:  VertexBufferLayout,
) -> RenderPipeline {
    return pipeline;
}
```

### R6.3 表达式换行
在运算符处断开。运算符留在行末。续行增加一级缩进。

```
// Input (假设 maxLineLength=40):
var result: f32 = a + b + c + d + e + f + g;

// Output:
var result: f32 = a + b + c + d
    + e + f + g;
```

### R6.4 函数调用换行
参数过多时换行，每个参数独占一行，增加一级缩进。

```
// Input (假设 maxLineLength=50):
var color: vec4<f32> = texture.Sample(samplerObj, uv, vec2<i32>(0, 0));

// Output:
var color: vec4<f32> = texture.Sample(
    samplerObj,
    uv,
    vec2<i32>(0, 0),
);
```

### R6.5 结构体始终换行
结构体字段始终每行一个，禁止单行结构体。

```
// Input:
struct Vertex{position:vec3<f32>,normal:vec3<f32>,}

// Output:
struct Vertex {
    position: vec3<f32>,
    normal:   vec3<f32>,
}
```

---

## R7 空行 (Blank Lines)

### R7.1 顶级声明间
不同类型的顶级声明之间加 1 个空行。相同类型之间不加空行。

```
// Input:
struct S{}
fn f(){}
struct T{}

// Output:
struct S {
}
fn f() {
}
struct T {
}
```

### R7.2 块内空行
块内最多保留 1 个连续空行。超过的合并为 1 个空行。

```
// Input:
fn main() {
    var x: f32 = 1.0;



    var y: f32 = 2.0;
    return x + y;
}

// Output:
fn main() {
    var x: f32 = 1.0;

    var y: f32 = 2.0;
    return x + y;
}
```

### R7.3 文件末尾
文件末尾有且仅有 1 个换行符。

---

## R8 注释 (Comments)

### R8.1 注释保持
注释内容保持不变。注释前的缩进保持不变。

```
// Input:
fn main() {
// comment
    return;
}

// Output:
fn main() {
    // comment
    return;
}
```

### R8.2 块注释
块注释保持原样。

---

## R9 函数 (Functions)

### R9.1 简单函数
```
// Input:
fn add(a:f32,b:f32)->f32{return a+b;}

// Output:
fn add(a: f32, b: f32) -> f32 {
    return a + b;
}
```

### R9.2 带属性的函数
```
// Input:
@vertex fn main(@builtin(vertex_index)vi:u32)->@builtin(position)vec4<f32>{return vec4<f32>(0.0,0.0,0.0,1.0);}

// Output:
@vertex
fn main(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4<f32> {
    return vec4<f32>(0.0, 0.0, 0.0, 1.0);
}
```

### R9.3 空函数
```
// Input:
fn empty(){}

// Output:
fn empty() {
}
```

---

## R10 结构体 (Structs)

### R10.1 基本结构体
```
// Input:
struct Vertex{position:vec3<f32>,normal:vec3<f32>,}

// Output:
struct Vertex {
    position: vec3<f32>,
    normal:   vec3<f32>,
}
```

### R10.2 带字段属性的结构体
```
// Input:
struct Input{@location(0)pos:vec3<f32>,@location(1)normal:vec3<f32>,}

// Output:
struct Input {
    @location(0) position: vec3<f32>,
    @location(1) normal:   vec3<f32>,
}
```

### R10.3 空结构体
```
// Input:
struct Empty{}

// Output:
struct Empty {
}
```

---

## R11 变量声明 (Variables)

### R11.1 var/let/const
```
// Input:
var x:f32=1.0;let PI:f32=3.14;const N:u32=256;

// Output:
var x: f32 = 1.0;
let PI: f32 = 3.14;
const N: u32 = 256;
```

### R11.2 存储类 (storage class)
```
// Input:
var<uniform>u:Uniforms;var<storage>d:array<f32>;var<workgroup>s:array<f32,64>;

// Output:
var<uniform> u: Uniforms;
var<storage> d: array<f32>;
var<workgroup> s: array<f32, 64>;
```

### R11.3 override 声明
```
// Input:
override maxLights:u32=4;

// Output:
override maxLights: u32 = 4;
```

---

## R12 控制流 (Control Flow)

### R12.1 if/else
```
// Input:
fn test(x:f32)->f32{if(x>0.0){return x;}else{return -x;}}

// Output:
fn test(x: f32) -> f32 {
    if (x > 0.0) {
        return x;
    } else {
        return -x;
    }
}
```

### R12.2 else if 链
```
// Input:
fn test(x:i32)->i32{if(x>10){return 1;}else if(x>5){return 2;}else{return 3;}}

// Output:
fn test(x: i32) -> i32 {
    if (x > 10) {
        return 1;
    } else if (x > 5) {
        return 2;
    } else {
        return 3;
    }
}
```

### R12.3 for 循环
```
// Input:
fn sum()->i32{var s:i32=0;for(var i:i32=0;i<10;i=i+1){s=s+i;}return s;}

// Output:
fn sum() -> i32 {
    var s: i32 = 0;
    for (var i: i32 = 0; i < 10; i = i + 1) {
        s = s + i;
    }
    return s;
}
```

### R12.4 while 循环
```
// Input:
fn dec(x:f32)->f32{var v:f32=x;while(v>0.0){v=v-0.1;}return v;}

// Output:
fn dec(x: f32) -> f32 {
    var v: f32 = x;
    while (v > 0.0) {
        v = v - 0.1;
    }
    return v;
}
```

### R12.5 loop 构造
```
// Input:
fn loopTest(){loop{if(true){break;}continue;}}

// Output:
fn loopTest() {
    loop {
        if (true) {
            break;
        }
        continue;
    }
}
```

### R12.6 switch/case
```
// Input:
fn getLabel(x:i32)->i32{switch(x){case 0:{return 10;}case 1,2:{return 20;}default:{return -1;}}}

// Output:
fn getLabel(x: i32) -> i32 {
    switch (x) {
        case 0: {
            return 10;
        }
        case 1, 2: {
            return 20;
        }
        default: {
            return -1;
        }
    }
}
```

### R12.7 return 语句
```
// Input:
fn one()->i32{return 1;}fn empty(){return;}

// Output:
fn one() -> i32 {
    return 1;
}
fn empty() {
    return;
}
```

### R12.8 break/continue
```
// Input:
fn test(){loop{if(true){break;}continue;}}

// Output:
fn test() {
    loop {
        if (true) {
            break;
        }
        continue;
    }
}
```

---

## R13 指令 (Directives)

### R13.1 enable
```
// Input:
enable f16;enable subgroups;

// Output:
enable f16;
enable subgroups;
```

### R13.2 diagnostic
```
// Input:
diagnostic(off,derivative_uniformity);

// Output:
diagnostic(off, derivative_uniformity);
```

### R13.3 alias
```
// Input:
alias Float4=vec4<f32>;alias LightArray=array<Light,4>;

// Output:
alias Float4 = vec4<f32>;
alias LightArray = array<Light, 4>;
```

---

## R14 表达式 (Expressions)

### R14.1 算术表达式
```
// Input:
var r:f32=a+b*c-d/e+f%g;

// Output:
var r: f32 = a + b * c - d / e + f % g;
```

### R14.2 比较和逻辑
```
// Input:
var r:bool=a==b&&c<d||e>f;

// Output:
var r: bool = a == b && c < d || e > f;
```

### R14.3 函数调用
```
// Input:
var v:vec4<f32>=vec4<f32>(1.0,2.0,3.0,4.0);

// Output:
var v: vec4<f32> = vec4<f32>(1.0, 2.0, 3.0, 4.0);
```

### R14.4 链式访问 (member access + index access)
```
// Input:
var v:f32=mat.data[0].value;
var w:f32=arr[i].field;

// Output:
var v: f32 = mat.data[0].value;
var w: f32 = arr[i].field;
```

### R14.5 复合赋值
```
// Input:
x+=1;y*=2;z&=3;w|=4;

// Output:
x += 1;
y *= 2;
z &= 3;
w |= 4;
```

### R14.6 位运算表达式
```
// Input:
var r:i32=a&b|c^d;
var s:i32=v<<2;
var t:i32=v>>2;

// Output:
var r: i32 = a & b | c ^ d;
var s: i32 = v << 2;
var t: i32 = v >> 2;
```

### R14.7 类型构造函数表达式
WGSL 类型关键字可作为构造函数调用，附带泛型参数和非泛型参数：
```
// Input:
var v:vec4<f32>=vec4<f32>(1.0);

// Output:
var v: vec4<f32> = vec4<f32>(1.0);
```

支持的类型关键字：`vec2` `vec3` `vec4` `mat2x2` `mat2x3` `mat2x4` `mat3x2` `mat3x3` `mat3x4` `mat4x2` `mat4x3` `mat4x4` `f32` `i32` `u32` `bool` `array`

### R14.8 括号表达式
```
// Input:
var r:f32=(a+b)*c;

// Output:
var r: f32 = (a + b) * c;
```

---

## R15 类型表达式 (Type Expressions)

### R15.1 简单类型
```
// Input:
var x:f32=0.0;
var y:i32=0;
var z:u32=0u;
var b:bool=true;

// Output:
var x: f32 = 0.0;
var y: i32 = 0;
var z: u32 = 0u;
var b: bool = true;
```

### R15.2 向量类型
```
// Input:
var v:vec3<f32>;
var u:vec4<i32>;;

// Output:
var v: vec3<f32>;
var u: vec4<i32>;
```

### R15.3 矩阵类型
```
// Input:
var m:mat4x4<f32>;
var n:mat3x3<f32>;

// Output:
var m: mat4x4<f32>;
var n: mat3x3<f32>;
```

### R15.4 数组类型
```
// Input:
var a:array<f32>;
var b:array<f32,16>;
var c:array<array<f32,4>,8>;

// Output:
var a: array<f32>;
var b: array<f32, 16>;
var c: array<array<f32, 4>, 8>;
```

### R15.5 指针类型
```
// Input:
var p:ptr<function,f32>;
var q:ptr<storage,array<u32>>;

// Output:
var p: ptr<function, f32>;
var q: ptr<storage, array<u32>>;
```

### R15.6 纹理采样器类型
```
// Input:
var t:texture_2d<f32>;
var d:texture_depth_2d;
var s:sampler;
var sc:sampler_comparison;

// Output:
var t: texture_2d<f32>;
var d: texture_depth_2d;
var s: sampler;
var sc: sampler_comparison;
```

### R15.7 原子类型
```
// Input:
var a:atomic<u32>;

// Output:
var a: atomic<u32>;
```

### R15.8 嵌套泛型
```
// Input:
var v:vec4<array<f32,4>>;
var m:array<array<vec4<f32>,4>,8>;

// Output:
var v: vec4<array<f32, 4>>;
var m: array<array<vec4<f32>, 4>, 8>;
```

---

## R16 格式化核心保证

### R16.1 幂等性 (Idempotency)
对已格式化的代码再次格式化，输出必须完全相同。
```
fn main() { return; }
 → 格式化 → fn main() {\n    return;\n}\n
 → 再次格式化 → fn main() {\n    return;\n}\n  // 完全相同
```

### R16.2 语法正确性保持
格式化不改变代码的语义。格式化的输出必须仍然是语法正确的 WGSL 代码。

### R16.3 错误时安全降级
当解析失败时，返回原始内容不变，不破坏用户代码。
```
fn invalid( { bad syntax }
 → 格式化 → fn invalid( { bad syntax }  // 原样返回
```

---

## R17 错误处理 (Error Handling)

### R17.1 语法错误恢复
解析失败时返回原始内容不变。

### R17.2 行结束符保持
- 检测原始文件使用 LF 或 CRLF
- 输出保持原始行结束风格

```
// Input (CRLF):
fn main() {\r\n    return;\r\n}

// Output (CRLF preserved):
fn main() {\r\n    return;\r\n}
```

### R17.3 超大文件保护
- 超过 5000 行时显示进度指示
- 超过 100MB 时内存限制保护

### R17.4 超时保护
- 默认 2 秒超时
- 超时时返回原始内容

---

## R18 配置选项

| 配置项 | 类型 | 默认值 | 范围 | 影响规则 |
|--------|------|--------|------|----------|
| `wgslFormatter.indentSize` | number | 4 | 1-8 | R1.1 |
| `wgslFormatter.useTabs` | boolean | false | - | R1.1 |
| `wgslFormatter.maxLineLength` | number | 100 | 40-200 | R6.1 |
| `wgslFormatter.enableLineWrapping` | boolean | true | - | R6 |

---

## R19 完整格式化示例

### R19.1 极简到完整着色器

输入:
```
// Input (unformatted):
struct Uniforms{modelView:mat4x4<f32>,projection:mat4x4<f32>,}struct Vertex{@location(0)pos:vec3<f32>,@location(1)normal:vec3<f32>,}@vertex fn main(input:Vertex)->@builtin(position)vec4<f32>{var worldPos:vec4<f32>=model*vec4<f32>(input.pos,1.0);return viewProjection*worldPos;}@fragment fn main()->@location(0)vec4<f32>{return vec4<f32>(1.0,0.0,0.0,1.0);}
```

输出:
```
// Output (formatted):
struct Uniforms {
    modelView:  mat4x4<f32>,
    projection: mat4x4<f32>,
}

struct Vertex {
    @location(0) pos: vec3<f32>,
    @location(1) pos: vec3<f32>,
}

@vertex
fn main(input: Vertex) -> @builtin(position) vec4<f32> {
    var worldPos: vec4<f32> = model * vec4<f32>(input.pos, 1.0);
    return viewProjection * worldPos;
}

@fragment
fn main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
```

### R19.2 复杂控制流

输入:
```
// Input:
fn computeLighting(normal:vec3<f32>,lightDir:vec3<f32>,viewDir:vec3<f32>,ambient:f32)->f32{
var diffuse:f32= max(dot(normal,lightDir),0.0);if(diffuse>0.0){
var halfDir:vec3<f32>=normalize(lightDir+viewDir);var specular:f32=pow(max(dot(normal,halfDir),0.0),32.0);
return ambient+diffuse+specular;}return ambient;}
```

输出:
```
// Output:
fn computeLighting(
    normal:   vec3<f32>,
    lightDir: vec3<f32>,
    viewDir:  vec3<f32>,
    ambient:  f32,
) -> f32 {
    var diffuse: f32 = max(dot(normal, lightDir), 0.0);
    if (diffuse > 0.0) {
        var halfDir: vec3<f32> = normalize(lightDir + viewDir);
        var specular: f32 = pow(max(dot(normal, halfDir), 0.0), 32.0);
        return ambient + diffuse + specular;
    }
    return ambient;
}
```

---

## 测试用例映射

每条规则可直接映射到测试：

| 规则 | 验证方式 | 测试文件 |
|------|----------|----------|
| R1.x | 缩进层级正确 | spec-driven.test.ts |
| R2.x | 括号位置正确 | spec-driven.test.ts |
| R3.x | 语句分行正确 | spec-driven.test.ts |
| R4.1-4.10 | 空格规则覆盖 | spec-driven.test.ts |
| R5.1-5.3 | 对齐计算正确 | spec-driven.test.ts |
| R6.1-6.5 | 换行逻辑正确 | spec-driven.test.ts / linewrapping.test.ts |
| R7.1-7.3 | 空行规则正确 | spec-driven.test.ts / newline.test.ts |
| R8.1-8.2 | 注释保持正确 | spec-driven.test.ts |
| R9.1-9.3 | 函数格式正确 | spec-driven.test.ts |
| R10.1-10.3 | 结构体格式正确 | spec-driven.test.ts |
| R11.1-11.3 | 变量声明格式正确 | spec-driven.test.ts |
| R12.1-12.8 | 控制流格式正确 | spec-driven.test.ts |
| R13.1-13.3 | 指令格式正确 | spec-driven.test.ts |
| R14.1-14.8 | 表达式格式正确 | spec-driven.test.ts |
| R15.1-15.8 | 类型表达式格式正确 | spec-driven.test.ts |
| R16.1-16.3 | 核心保证验证 | formatter.test.ts |
| R17.1-17.4 | 错误处理正确 | formatter.test.ts / errors.test.ts |
| R19.1-19.2 | 完整示例端到端 | e2e.test.ts |

