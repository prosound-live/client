import { NextRequest, NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;
const GATEWAY_URL = process.env.GATEWAY_URL;

export async function POST(request: NextRequest) {
  if (!PINATA_JWT) {
    return NextResponse.json(
      { success: false, message: "Pinata JWT not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { metadata } = body;

    if (!metadata) {
      return NextResponse.json(
        { success: false, message: "Metadata is required" },
        { status: 400 }
      );
    }

    // Upload JSON metadata to Pinata
    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinJSONToIPFS",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify({
          pinataContent: metadata,
          pinataMetadata: {
            name: `${metadata.title || "music"}-metadata.json`,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to upload to Pinata");
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      ipfsHash: result.IpfsHash,
      pinSize: result.PinSize,
      timestamp: result.Timestamp,
      metadataUrl: GATEWAY_URL
        ? `https://${GATEWAY_URL}/ipfs/${result.IpfsHash}`
        : `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
    });
  } catch (error) {
    console.error("Pinata upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}
