// internal/data/postgres/client.go (or similar)

func NewClient() (*ent.Client, error) {
	// ... setup ...
	client := ent.NewClient(ent.Driver(drv))

	// Register Hooks
	client.Node.Use(hooks.NodeClosureHook(client))  // Block 1
	client.Node.Use(hooks.FsrsCardInitHook(client)) // Block 2 NEW!

	return client, nil
}
