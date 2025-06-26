import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
const execAsync = promisify(exec);
export function setupBlenderTools(server: McpServer): void {
  // Execute Blender Python script
  server.registerTool(
    "execute_script",
    {
      title: "Execute Blender Script",
      description: "Execute a Python script in Blender",
      inputSchema: {
        script: z.string().describe("Python script to execute in Blender"),
        blend_file: z.string().optional().describe("Path to .blend file to open (optional)"),
        output_format: z.enum(["json", "text"]).default("json").describe("Output format")
      }
    },
    async ({ script, blend_file, output_format }) => {
      const blenderPath = process.env.BLENDER_PATH || "blender";
      const tempScript = join(process.cwd(), `temp_${Date.now()}.py`);
      
      try {
        writeFileSync(tempScript, script);
        
        const blendArg = blend_file ? `"${blend_file}"` : "--factory-startup";
        const command = `"${blenderPath}" ${blendArg} --background --python "${tempScript}"`;
        
        const { stdout, stderr } = await execAsync(command);
        
        unlinkSync(tempScript);
        
        const result = {
          success: true,
          output: stdout,
          errors: stderr || null,
          timestamp: new Date().toISOString()
        };
        return {
          content: [{
            type: "text",
            text: output_format === "json" ? JSON.stringify(result, null, 2) : stdout
          }]
        };
      } catch (error) {
        unlinkSync(tempScript);
        throw new Error(`Blender execution failed: ${error.message}`);
      }
    }
  );
  // Create basic objects
  server.registerTool(
    "create_object",
    {
      title: "Create Blender Object",
      description: "Create basic objects in Blender scene",
      inputSchema: {
        object_type: z.enum(["cube", "sphere", "cylinder", "plane", "monkey"]).describe("Type of object to create"),
        name: z.string().optional().describe("Name for the object"),
        location: z.array(z.number()).length(3).optional().describe("Location coordinates [x, y, z]"),
        scale: z.array(z.number()).length(3).optional().describe("Scale values [x, y, z]"),
        blend_file: z.string().optional().describe("Path to .blend file")
      }
    },
    async ({ object_type, name, location, scale, blend_file }) => {
      const objectName = name || `${object_type}_${Date.now()}`;
      const loc = location || [0, 0, 0];
      const scl = scale || [1, 1, 1];
      
      const script = `
import bpy
# Clear existing mesh objects
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False, confirm=False)
# Create object
if "${object_type}" == "cube":
    bpy.ops.mesh.primitive_cube_add(location=(${loc.join(',')}))
elif "${object_type}" == "sphere":
    bpy.ops.mesh.primitive_uv_sphere_add(location=(${loc.join(',')}))
elif "${object_type}" == "cylinder":
    bpy.ops.mesh.primitive_cylinder_add(location=(${loc.join(',')}))
elif "${object_type}" == "plane":
    bpy.ops.mesh.primitive_plane_add(location=(${loc.join(',')}))
elif "${object_type}" == "monkey":
    bpy.ops.mesh.primitive_monkey_add(location=(${loc.join(',')}))
# Set name and scale
obj = bpy.context.active_object
obj.name = "${objectName}"
obj.scale = (${scl.join(',')})
print(f"Created {obj.name} at location {obj.location}")
`;
      return server.request({
        method: "tools/call",
        params: {
          name: "execute_script",
          arguments: { script, blend_file }
        }
      });
    }
  );
  // Render scene
  server.registerTool(
    "render_scene",
    {
      title: "Render Scene",
      description: "Render the current Blender scene",
      inputSchema: {
        output_path: z.string().describe("Output file path for rendered image"),
        engine: z.enum(["CYCLES", "EEVEE"]).default("EEVEE").describe("Render engine"),
        resolution: z.array(z.number()).length(2).optional().describe("Resolution [width, height]"),
        samples: z.number().optional().describe("Number of samples for rendering"),
        blend_file: z.string().optional().describe("Path to .blend file")
      }
    },
    async ({ output_path, engine, resolution, samples, blend_file }) => {
      const res = resolution || [1920, 1080];
      const sampleCount = samples || 64;
      
      const script = `
import bpy
# Set render settings
scene = bpy.context.scene
scene.render.engine = '${engine}'
scene.render.resolution_x = ${res[0]}
scene.render.resolution_y = ${res[1]}
if '${engine}' == 'CYCLES':
    scene.cycles.samples = ${sampleCount}
elif '${engine}' == 'EEVEE':
    scene.eevee.taa_render_samples = ${sampleCount}
# Set output path
scene.render.filepath = "${output_path}"
# Render
bpy.ops.render.render(write_still=True)
print(f"Rendered scene to {scene.render.filepath}")
`;
      return server.request({
        method: "tools/call",
        params: {
          name: "execute_script",
          arguments: { script, blend_file }
        }
      });
    }
  );
  // Export scene
  server.registerTool(
    "export_scene",
    {
      title: "Export Scene",
      description: "Export Blender scene to various formats",
      inputSchema: {
        output_path: z.string().describe("Output file path"),
        format: z.enum(["OBJ", "FBX", "GLTF", "STL"]).describe("Export format"),
        selected_only: z.boolean().default(false).describe("Export only selected objects"),
        blend_file: z.string().optional().describe("Path to .blend file")
      }
    },
    async ({ output_path, format, selected_only, blend_file }) => {
      const script = `
import bpy
# Select objects if needed
if not ${selected_only}:
    bpy.ops.object.select_all(action='SELECT')
# Export based on format
if "${format}" == "OBJ":
    bpy.ops.export_scene.obj(filepath="${output_path}")
elif "${format}" == "FBX":
    bpy.ops.export_scene.fbx(filepath="${output_path}")
elif "${format}" == "GLTF":
    bpy.ops.export_scene.gltf(filepath="${output_path}")
elif "${format}" == "STL":
    bpy.ops.export_mesh.stl(filepath="${output_path}")
print(f"Exported scene to {output_path} in ${format} format")
`;
      return server.request({
        method: "tools/call",
        params: {
          name: "execute_script",
          arguments: { script, blend_file }
        }
      });
    }
  );
}