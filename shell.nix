{
  pkgs ? import <nixpkgs> { },
}:
pkgs.mkShell {
  buildInputs = [
    pkgs.prisma-engines_7
    pkgs.prisma_7
    pkgs.bun
    pkgs.nodejs_24
    pkgs.openssl.dev
  ];

  shellHook = ''
    export PKG_CONFIG_PATH="${pkgs.openssl.dev}/lib/pkgconfig"
    export PRISMA_SCHEMA_ENGINE_BINARY="${pkgs.prisma-engines}/bin/schema-engine"
    export PRISMA_FMT_BINARY="${pkgs.prisma-engines}/bin/prisma-fmt"
  '';
}
