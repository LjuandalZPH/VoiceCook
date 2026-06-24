{
  description = "Flake de desarrollo - VoiceCook";
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs {
        inherit system;
      };
    in {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          nodejs_24
        ];

        shellHook = ''
          echo "Entorno de Node preparado con:"
          node -v
        '';
      };
    };
}
