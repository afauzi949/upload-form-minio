import { NextRequest } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "@/lib/s3-client";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get("filename");
  const contentType = searchParams.get("contentType") || "application/octet-stream";

  if (!filename) {
    return Response.json(
      { error: "filename query parameter is required" },
      { status: 400 }
    );
  }

  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `uploads/${timestamp}-${sanitizedFilename}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    return Response.json({
      url: presignedUrl,
      key,
      bucket: BUCKET_NAME,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return Response.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
