// Packs the handful of CC0 models the sky kingdom uses into small, compressed GLB files.
//
// The source packs stay outside the repo. Download them (see CREDITS.md), unzip each into
// its folder under ~/portfolio-asset-packs (or set ASSET_PACKS), then run:
//
//   node scripts/build-models.mjs
//
// Output goes to public/models/.

import { mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, mergeDocuments, meshopt, prune, textureCompress, unpartition } from '@gltf-transform/functions'
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer'
import sharp from 'sharp'

const packs = process.env.ASSET_PACKS ?? join(homedir(), 'portfolio-asset-packs')
const kaykit = join(packs, 'kaykit-adventurers/extracted/KayKit_Adventurers_2.0_FREE')
const village = join(packs, 'quaternius-medieval-village/extracted/Medieval Village MegaKit[Standard]/glTF')
const nature = join(packs, 'kenney-nature-kit/extracted/Models/GLTF format')
const out = join(import.meta.dirname, '../public/models')

const villagePieces = [
  'Wall_Plaster_Straight',
  'Wall_Plaster_Door_Round',
  'Wall_Plaster_Window_Wide_Round',
  'Wall_Plaster_WoodGrid',
  'Wall_UnevenBrick_Straight',
  'Wall_UnevenBrick_Door_Round',
  'Wall_UnevenBrick_Window_Wide_Round',
  'Corner_Exterior_Wood',
  'Corner_Exterior_Brick',
  'Roof_RoundTiles_4x4',
  'Roof_RoundTiles_4x6',
  'Prop_Chimney',
]

const naturePieces = [
  'tree_default',
  'tree_oak',
  'tree_fat',
  'tree_pineRoundA',
  'tree_pineTallA',
  'plant_bushLarge',
  'plant_bush',
  'flower_redA',
  'flower_yellowA',
  'flower_purpleA',
  'rock_largeA',
  'rock_smallC',
]

const heroAnimations = ['Idle_A', 'Walking_A', 'Running_A', 'Interact']

// Townspeople share the hero's rig, so they reuse the same animation clips.
const townspeople = ['Mage', 'Knight', 'Ranger', 'Barbarian']

await MeshoptEncoder.ready
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })

// Merges each file into one document, under a single scene, with each file's content
// grouped under a node named after the file.
async function mergeFiles(files) {
  const [first, ...rest] = files
  const document = await io.read(first)
  for (const file of rest) mergeDocuments(document, await io.read(file))

  const root = document.getRoot()
  const [scene, ...extra] = root.listScenes()
  root.listScenes().forEach((s, i) => {
    const group = document.createNode(basename(files[i]).replace(/\.(gltf|glb)$/, ''))
    for (const child of s.listChildren()) {
      s.removeChild(child)
      group.addChild(child)
    }
    scene.addChild(group)
  })
  extra.forEach((s) => s.dispose())
  return document
}

async function write(document, name) {
  await document.transform(dedup(), prune(), unpartition(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }))
  await io.write(join(out, name), document)
  console.log(`wrote public/models/${name}`)
}

mkdirSync(out, { recursive: true })

// Village: keep only base colour textures (the cel shading ignores the rest), shrink them to WebP.
{
  const document = await mergeFiles(villagePieces.map((p) => join(village, `${p}.gltf`)))
  for (const material of document.getRoot().listMaterials()) {
    material.setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null)
  }
  await document.transform(
    prune(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 80 }),
  )
  await write(document, 'village.glb')
}

// Nature: flat-coloured, no textures.
await write(await mergeFiles(naturePieces.map((p) => join(nature, `${p}.glb`))), 'nature.glb')

// Characters: the Rogue hero and the townspeople, with textures shrunk.
for (const [source, name] of [['Rogue', 'hero'], ...townspeople.map((t) => [t, `npc-${t.toLowerCase()}`])]) {
  const document = await io.read(join(kaykit, `Characters/gltf/${source}.glb`))
  await document.transform(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 85 }))
  await write(document, `${name}.glb`)
}

// Hero animations: clips only, from the shared rig, with the rig's own preview mesh removed.
{
  const document = await mergeFiles([
    join(kaykit, 'Animations/gltf/Rig_Medium/Rig_Medium_MovementBasic.glb'),
    join(kaykit, 'Animations/gltf/Rig_Medium/Rig_Medium_General.glb'),
  ])
  const root = document.getRoot()
  const seen = new Set()
  for (const animation of root.listAnimations()) {
    const name = animation.getName()
    if (!heroAnimations.includes(name) || seen.has(name)) animation.dispose()
    else seen.add(name)
  }
  // Both files carry their own copy of the rig; point every clip at the first copy so
  // three.js binds them all to the same bone names.
  const [firstRig] = root.listScenes()[0].listChildren()
  const bones = new Map()
  firstRig.traverse((node) => bones.set(node.getName(), node))
  for (const animation of root.listAnimations()) {
    for (const channel of animation.listChannels()) {
      const target = bones.get(channel.getTargetNode()?.getName())
      if (target) channel.setTargetNode(target)
    }
  }
  for (const node of root.listNodes()) {
    node.setMesh(null)
    node.setSkin(null)
  }
  await write(document, 'hero-animations.glb')
}
