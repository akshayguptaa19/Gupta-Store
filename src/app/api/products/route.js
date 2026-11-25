
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import {
  getSupabaseProducts,
  updateSupabaseProduct,
  setSupabaseProductStock,
  setSupabaseProductImage,
  setSupabaseProductAvailability,
  createSupabaseProduct,
  hideSupabaseProduct,
} from "@/lib/supabaseProducts";

export const dynamic = "force-dynamic";

function responseError(error, message = "Operation failed") {
  console.error("Supabase products API error:", error);
  return NextResponse.json(
    { ok: false, message: error?.message || message },
    { status: 500 }
  );
}

export async function GET() {
  try {
    const products = await getSupabaseProducts();

    return NextResponse.json({
      ok: true,
      products,
      updatedAt: new Date().toISOString(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    return responseError(error, "Failed to fetch products");
  }
}

export async function POST(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json(
      { ok: false, message: "Admin authentication required" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "UPDATE_PRODUCT") {
      if (!body.product?.id) {
        return NextResponse.json(
          { ok: false, message: "Invalid product payload" },
          { status: 400 }
        );
      }

      await updateSupabaseProduct(body.product);
    } else if (action === "CREATE_PRODUCT") {
      if (!body.product?.name) {
        return NextResponse.json(
          { ok: false, message: "Product name required" },
          { status: 400 }
        );
      }

      const product = {
        ...body.product,
        id: body.product.id || String(Date.now()),
      };

      await createSupabaseProduct(product);
    } else if (action === "DELETE_PRODUCT") {
      if (body.id == null || body.id === "") {
        return NextResponse.json(
          { ok: false, message: "Product ID required" },
          { status: 400 }
        );
      }

      await hideSupabaseProduct(body.id);
    } else if (action === "SET_STOCK") {
      if (body.id == null || body.id === "") {
        return NextResponse.json(
          { ok: false, message: "Product ID required" },
          { status: 400 }
        );
      }

      await setSupabaseProductStock(body.id, body.stock);
    } else if (action === "TOGGLE_AVAILABILITY") {
      if (body.id == null || body.id === "") {
        return NextResponse.json(
          { ok: false, message: "Product ID required" },
          { status: 400 }
        );
      }

      await setSupabaseProductAvailability(body.id, body.available);
    } else if (action === "SET_IMAGE") {
      if (body.id == null || body.id === "" || !body.image) {
        return NextResponse.json(
          { ok: false, message: "Product ID and image URL required" },
          { status: 400 }
        );
      }

      await setSupabaseProductImage(body.id, body.image);
    } else {
      return NextResponse.json(
        { ok: false, message: "Unknown action" },
        { status: 400 }
      );
    }

    const products = await getSupabaseProducts();

    return NextResponse.json({
      ok: true,
      products,
      message: "Product operation completed successfully",
    });
  } catch (error) {
    return responseError(error);
  }
}
