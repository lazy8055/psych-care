import qrcode

def generate_qr(id_str, filename="qrcode.png"):
    img = qrcode.make(id_str)
    img.save(filename)
    print(f"QR code saved as {filename}")

# Example usage
generate_qr("67e8e9a186a29972a59beb3e")
