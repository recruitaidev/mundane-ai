import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
const execAsync = promisify(exec);
export function setupBlenderResources(server: McpServer): void {
  // Scene information resource
  server.registerResource(
    "scene-info",
    "blender://scene/{file}",
    {
      title: "Blender Scene Information",
      description: "Get information about objects, materials, and settings in a Blender scene",
      mimeType: "application/json"
    },
    async (uri: URL) => {
      const blendFile = uri.pathname.split('/')[2];
      const blenderPath = process.env.BLENDER_PATH || "blender";
      const tempScript = join(process.cwd(), `scene_info_${Date.now()}.py`);
      
      const script = `
import bpy
import json
scene_info = {
    "scene_name": bpy.context.scene.name,
    "objects": [],
    "materials": [],
    "cameras": [],
    "lights": [],
    "render_settings": {
        "engine": bpy.context.scene.render.engine,
        "resolution": [
            bpy.context.scene.render.resolution_x,
            bpy.context.scene.render.resolution_y
        ],
        "frame_range": [
            bpy.context.scene.frame_start,
            bpy.context.scene.frame_end
        ]
    }
}
# Get objects
for obj in bpy.data.objects:
    obj_data = {
        "name": obj.name,
        "type": obj.type,
        "location": list(obj.location),
        "rotation": list(obj.rotation_euler),
        "scale": list(obj.scale),
        "visible": obj.visible_get()
    }
    scene_info["objects"].append(obj_data)
# Get materials
for mat in bpy.data.materials:
    mat_data = {
        "name": mat.name,
        "use_nodes": mat.use_nodes,
        "diffuse_color": list(mat.diffuse_color) if hasattr(mat, 'diffuse_color') else None
    }
    scene_info["materials"].append(mat_data)
# Get cameras
for obj in bpy.data.objects:
    if obj.type == 'CAMERA':
        cam_data = {
            "name": obj.name,
            "location": list(obj.location),
            "rotation": list(obj.rotation_euler),
            "lens": obj.data.lens,
            "clip_start": obj.data.clip_start,
            "clip_end": obj.data.clip_end
        }
        scene_info["cameras"].append(cam_data)
# Get lights
for obj in bpy.data.objects:
    if obj.type == 'LIGHT':
        light_data = {
            "name": obj.name,
            "type": obj.data.type,
            "location": list(obj.location),
            "energy": obj.data.energy,
            "color": list(obj.data.color)
        }
        scene_info["lights"].append(light_data)
print(json.dumps(scene_info, indent=2))
`;
      try {
        writeFileSync(tempScript, script);
        
        const blendArg = blendFile && blendFile !== 'current' ? `"${blendFile}"` : "--factory-startup";
        const command = `"${blenderPath}" ${blendArg} --background --python "${tempScript}"`;
        
        const { stdout } = await execAsync(command);
        unlinkSync(tempScript);
        
        const sceneData = JSON.parse(stdout.split('\n').find(line => line.startsWith('{')));
        
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(sceneData, null, 2),
            mimeType: "application/json"
          }]
        };
      } catch (error) {
        if (tempScript) unlinkSync(tempScript);
        throw new Error(`Failed to get scene info: ${error.message}`);
      }
    }
  );
  // Blender version and capabilities
  server.registerResource(
    "blender-info",
    "blender://info",
    {
      title: "Blender Installation Information",
      description: "Information about the Blender installation and capabilities",
      mimeType: "application/json"
    },
    async (uri: URL) => {
      const blenderPath = process.env.BLENDER_PATH || "blender";
      
      try {
        const { stdout } = await execAsync(`"${blenderPath}" --version`);
        
        const versionInfo = {
          blender_path: blenderPath,
          version_output: stdout.trim(),
          available_engines: ["CYCLES", "EEVEE"],
          supported_formats: {
            import: ["OBJ", "FBX", "GLTF", "STL", "PLY", "3DS"],
            export: ["OBJ", "FBX", "GLTF", "STL", "PLY"]
          },
          python_api_available: true,
          timestamp: new Date().toISOString()
        };
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(versionInfo, null, 2),
            mimeType: "application/json"
          }]
        };
      } catch (error) {
        throw new Error(`Failed to get Blender info: ${error.message}`);
      }
    }
  );
}