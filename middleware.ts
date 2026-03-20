import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const MAINTENANCE_PATH = "/maintenance";

function isMaintenanceEnabled() {
  return process.env.MAINTENANCE_MODE === "true";
}

export function middleware(request: NextRequest) {
  if (!isMaintenanceEnabled()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  if (pathname === MAINTENANCE_PATH || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        error: "Site fora do ar",
        message: "Estamos realizando ajustes temporários. Tente novamente em instantes.",
      },
      {
        status: 503,
        headers: {
          "Retry-After": "3600",
        },
      },
    );
  }

  const maintenanceUrl = request.nextUrl.clone();
  maintenanceUrl.pathname = MAINTENANCE_PATH;
  maintenanceUrl.search = "";

  return NextResponse.rewrite(maintenanceUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|manifest).*)",
  ],
};
