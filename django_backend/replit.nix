{ pkgs }: {
  deps = [
    pkgs.python311
    pkgs.python311Packages.pip
    pkgs.python311Packages.uv
    pkgs.postgresql_16
    pkgs.pango
    pkgs.cairo
    pkgs.pango.out
    pkgs.cairo.out
    pkgs.poppler
    pkgs.glib
    pkgs.pkg-config
    pkgs.which
    pkgs.libffi
    pkgs.libxcrypt
  ];
}
