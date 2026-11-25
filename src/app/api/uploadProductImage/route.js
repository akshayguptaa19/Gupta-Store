import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin.js";
import {
  STORAGE_BUCKET,
  extractSupabaseStoragePath,
  deleteSupabaseStorageImage,
} from "@/lib/supabaseStorage.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json(
        { ok: false, message: "Admin authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const productId = String(formData.get("productId") || "").trim();
    const image = formData.get("image");

    if (!productId) {
      return NextResponse.json(
        { ok: false, message: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!image || typeof image === "string") {
      return NextResponse.json(
        { ok: false, message: "Image file is required" },
        { status: 400 }
      );
    }

    if (!Object.hasOwn(ALLOWED_TYPES, image.type)) {
      return NextResponse.json(
        { ok: false, message: "Only JPG, PNG and WebP images are allowed" },
        { status: 400 }
      );
    }

    if (image.size <= 0 || image.size > MAX_SIZE) {
      return NextResponse.json(
        { ok: false, message: "Image must be between 1 byte and 5 MB" },
        { status: 400 }
      );
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
    let productQuery = supabaseAdmin
      .from("products")
      .select("id, legacy_mongo_id, image_url");

    if (isUuid) {
      productQuery = productQuery.or(`id.eq.${productId},legacy_mongo_id.eq.${productId}`);
    } else {
      productQuery = productQuery.eq("legacy_mongo_id", productId);
    }

    const { data: product, error: lookupError } = await productQuery.maybeSingle();

    if (lookupError) {
      console.error("Product lookup failed:", lookupError.message);
      return NextResponse.json(
        { ok: false, message: "Could not verify product" },
        { status: 500 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { ok: false, message: "Product not found in Supabase" },
        { status: 404 }
      );
    }

    const previousImageUrl = product.image_url;
    const previousStoragePath = extractSupabaseStoragePath(previousImageUrl, STORAGE_BUCKET);

    const extension = ALLOWED_TYPES[image.type];
    const safeId = productId.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fileName = `products/${safeId}.${extension}`;
    const buffer = Buffer.from(await image.arrayBuffer());

    // 1. Upload new image using upsert: true (replaces existing file if same name/ext)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: image.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase image upload failed:", uploadError.message);
      return NextResponse.json(
        { ok: false, message: "Image upload failed" },
        { status: 502 }
      );
    }

    // 2. Obtain public URL with version parameter for cache-busting
    const { data: publicData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    const publicUrl = `${publicData.publicUrl}?v=${Date.now()}`;

    // 3. Update product with new public URL in Supabase database
    const { data: updatedProduct, error: updateError } = await supabaseAdmin
      .from("products")
      .update({
        image_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)
      .select("id, legacy_mongo_id, name, image_url")
      .single();

    if (updateError) {
      console.error("Product image URL update failed:", updateError.message);
      return NextResponse.json(
        {
          ok: false,
          message: "Image uploaded, but saving its URL to the product failed",
          imageUploaded: true,
        },
        { status: 500 }
      );
    }

    // 4. If previous image had a different extension/path in Supabase storage, remove it to save storage
    if (previousStoragePath && previousStoragePath !== fileName) {
      deleteSupabaseStorageImage(previousImageUrl, STORAGE_BUCKET).catch((err) => {
        console.warn("[Supabase Storage Cleanup Notice]:", err.message);
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Image uploaded and old image replaced successfully",
      url: updatedProduct.image_url,
      image: updatedProduct.image_url,
      filename: fileName,
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Product image upload error:", error);
    return NextResponse.json(
      { ok: false, message: "Server error uploading image" },
      { status: 500 }
    );
  }
}
