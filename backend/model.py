import argparse, os, json
import skimage, torch, torchvision
import torchxrayvision as xrv


def load_and_prepare_image(image_path: str):
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image not found: {image_path}")
    img = skimage.io.imread(image_path)
    img = xrv.datasets.normalize(img, 255)  # convert 8-bit image to [-1024, 1024]

    # Handle channel variations
    if img.ndim == 3:
        # If RGB or multi-channel, average to single channel
        if img.shape[2] > 1:
            img = img.mean(2)
        else:  # single channel in 3D shape (H, W, 1)
            img = img[:, :, 0]
    elif img.ndim != 2:
        raise ValueError(f"Unexpected image shape: {img.shape}. Expected 2D or 3D array.")

    # Add channel dimension -> (1, H, W)
    img = img[None, ...]

    transform = torchvision.transforms.Compose([
        xrv.datasets.XRayCenterCrop(),
        xrv.datasets.XRayResizer(224)
    ])

    img = transform(img)  # still numpy
    tensor = torch.from_numpy(img).float()  # (1, H, W)
    return tensor


def run_inference(image_tensor: torch.Tensor, device: torch.device):
    model = xrv.models.DenseNet(weights="densenet121-res224-all").to(device)
    image_tensor = image_tensor.to(device)
    with torch.no_grad():
        outputs = model(image_tensor[None, ...])  # add batch dim -> (1, 1, H, W)
    probs = outputs[0].detach().cpu().numpy()
    return dict(zip(model.pathologies, probs))


def main():
    parser = argparse.ArgumentParser(description="Run TorchXRayVision model on a chest X-ray image.")
    parser.add_argument('--image', '-i', default=os.environ.get('IMAGE_PATH', './assets/test-pneumonia.jpeg'),
                        help='Path to input image.')
    parser.add_argument('--json', action='store_true', help='Print output as JSON.')
    args = parser.parse_args()

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    print(f"Loading image: {args.image}")

    img_tensor = load_and_prepare_image(args.image)
    results = run_inference(img_tensor, device)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        for k, v in sorted(results.items()):
            print(f"{k}: {float(v):.4f}")


if __name__ == '__main__':
    main()
