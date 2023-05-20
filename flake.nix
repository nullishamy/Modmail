{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-22.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  description = "Development shell flake";
  outputs = { self, nixpkgs, flake-utils }: flake-utils.lib.eachDefaultSystem (system: {
    devShell = let 
      pkgs = nixpkgs.legacyPackages.${system};
    in 
      pkgs.mkShell {
        packages = with pkgs; [
          nodejs-16_x
          nodePackages.npm
          nodePackages_latest.prisma
          cowsay 
          postgresql
        ];
        # Put the PostgreSQL databases in the project diretory.
        shellHook = with pkgs; ''
        # init the db with 
        mkdir -p ./prisma/db/

        export PGDATA="$(pwd)/prisma/db"
        export PGHOST="$(pwd)"
        export PGPORT="5432"
        export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"

        export PRISMA_MIGRATION_ENGINE_BINARY="${prisma-engines}/bin/migration-engine"
        export PRISMA_QUERY_ENGINE_BINARY="${prisma-engines}/bin/query-engine"
        export PRISMA_QUERY_ENGINE_LIBRARY="${prisma-engines}/lib/libquery_engine.node"
        export PRISMA_INTROSPECTION_ENGINE_BINARY="${prisma-engines}/bin/introspection-engine"
        export PRISMA_FMT_BINARY="${prisma-engines}/bin/prisma-fmt"

        if [[ ! $(grep listen_address $PGDATA/postgresql.conf) ]]; then
          echo "db does not exist, creating "
          initdb -D $PGDATA --no-locale --encoding=UTF8

          cat >> "$PGDATA/postgresql.conf" <<-EOF
          listen_addresses = 'localhost'
          port = $PGPORT
          unix_socket_directories = '$PGHOST'
          EOF

          # ...create a database using the name Postgres defaults to.
          echo "CREATE USER postgres SUPERUSER;" | postgres --single -E postgres
          echo "CREATE DATABASE postgres WITH OWNER postgres;" | postgres --single -E postgres
        fi

        ## command to access the db after start
        # psql -h localhost postgres

        ## command to kill the db 
        # pg_ctl -D ./db stop

        # trap "pg_ctl -D ./db stop" EXIT
      '';
      };
  });
}
