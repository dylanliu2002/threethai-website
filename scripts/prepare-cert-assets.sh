#!/usr/bin/env bash
# Prepare verified certificate & patent assets for the website.
# - Copy buyer-facing PDFs (small, current versions only) to public/documents/
# - Render first-page preview JPGs (150 DPI) to public/images/certificates/
set -euo pipefail

SRC="/home/z/my-project/upload/certs-patents/山东荣沣纺织有限公司专利+认证+OEKO"
PUB="/home/z/my-project/public"
DOCS="$PUB/documents"
IMGS="$PUB/images/certificates"

mkdir -p "$DOCS" "$IMGS"

# ---- 1. Copy PDFs with clean, SEO-friendly filenames ----
cp "$SRC/9000认证/Q_20260807093259英文证书(存档)(1).pdf" "$DOCS/iso-9001-certificate-en.pdf"
cp "$SRC/9000认证/Q_20260807093314中文证书(存档).pdf"     "$DOCS/iso-9001-certificate-zh.pdf"
cp "$SRC/OEKO证书+产品检测/OEKO证书2026年CE_714953_SH005ZH_275198.1_OTC_20260107112814_BG_en-US_zh-CN.pdf" "$DOCS/oeko-tex-standard-100-certificate-2026.pdf"
cp "$SRC/OEKO证书+产品检测/产品检测2026RE_713781_SH005ZH_275198.1-1_OTC_20260107112753_en-US.PDF"          "$DOCS/testex-test-report-sh005-275198-1.pdf"
cp "$SRC/国外申请发明专利/尼日利亚-WZF03201PTEA01D2600002-专利证书.pdf" "$DOCS/patent-certificate-nigeria-2026.pdf"
cp "$SRC/国外申请发明专利/马耳他-WZF03201PTEA01D2600001-专利证书.pdf"   "$DOCS/patent-certificate-malta-2026.pdf"

# ---- 2. First-page preview images ----
pdftoppm -jpeg -r 150 -f 1 -l 1 -jpegopt quality=88 \
  "$DOCS/iso-9001-certificate-en.pdf" "$IMGS/iso-9001-en"
pdftoppm -jpeg -r 150 -f 1 -l 1 -jpegopt quality=88 \
  "$DOCS/iso-9001-certificate-zh.pdf" "$IMGS/iso-9001-zh"
pdftoppm -jpeg -r 150 -f 1 -l 1 -jpegopt quality=88 \
  "$DOCS/oeko-tex-standard-100-certificate-2026.pdf" "$IMGS/oeko-tex-en"
pdftoppm -jpeg -r 150 -f 1 -l 1 -jpegopt quality=88 \
  "$DOCS/testex-test-report-sh005-275198-1.pdf" "$IMGS/testex-report"
pdftoppm -jpeg -r 150 -f 1 -l 1 -jpegopt quality=88 \
  "$DOCS/patent-certificate-nigeria-2026.pdf" "$IMGS/patent-nigeria"
pdftoppm -jpeg -r 150 -f 1 -l 1 -jpegopt quality=88 \
  "$DOCS/patent-certificate-malta-2026.pdf" "$IMGS/patent-malta"

# pdftoppm appends -1 / -01 suffixes; normalize
for f in "$IMGS"/*.jpg; do
  [ -e "$f" ] || continue
  base="$(basename "$f")"
  case "$base" in
    *-01.jpg) mv "$f" "$IMGS/$(echo "$base" | sed 's/-01\.jpg$/.jpg/')" ;;
    *-1.jpg)  mv "$f" "$IMGS/$(echo "$base" | sed 's/-1\.jpg$/.jpg/')" ;;
  esac
done

echo "---- documents ----"
ls -la "$DOCS"
echo "---- preview images ----"
ls -la "$IMGS"
