# @gamepark/react-game

React components & tools to create a Board Game user interface for Game Park.

## Sounds deployment

Default sounds (e.g. turn notification) are hosted on `sounds.game-park.com` (Clever Cloud Cellar).

The `sounds/` directory at the root of this project contains the sound files to deploy.

### rclone configuration

Install [rclone](https://rclone.org/) then configure a remote:

```
rclone config
> n
name> sounds
Storage> s3
provider> Other
env_auth> false
access_key_id> [your key - do not commit!]
secret_access_key> [your secret - do not commit!]
region>
endpoint> cellar-c2.services.clever-cloud.com
location_constraint>
acl> public-read
Edit advanced config> n
```

### Deploy sounds

Sounds are automatically synced during `yarn publish`. You can also sync manually:

```bash
yarn sync-sounds
```

### CORS

The Cellar bucket must have CORS configured to allow `fetch()` from game origins (`Access-Control-Allow-Origin: *`).
