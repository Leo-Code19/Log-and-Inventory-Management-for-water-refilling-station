{!editMode.name ? (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
      Name: <span style={{ fontWeight: 400 }}>{`${tempUserData.first_name || ''} ${tempUserData.last_name || ''}`.trim() || 'Add your name'}</span>
    </Typography>
    <IconButton
      size="small"
      onClick={() => startEditing('name')}
      disabled={saving}
    >
      <EditIcon fontSize="small" />
    </IconButton>
  </Box>
) : (
  <div className="flex items-center justify-between w-full">
    <div className="flex flex-col">
      <span className="text-sm text-gray-500 dark:text-gray-400">Name</span>
      <div className="flex flex-col space-y-2">
        <input
          type="text"
          className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={tempUserData.first_name}
          onChange={(e) => setTempUserData({...tempUserData, first_name: e.target.value})}
          placeholder="First Name"
        />
        <input
          type="text"
          className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={tempUserData.last_name}
          onChange={(e) => setTempUserData({...tempUserData, last_name: e.target.value})}
          placeholder="Last Name"
        />
      </div>
    </div>
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
      <Button
        variant="outlined"
        size="small"
        startIcon={<CancelIcon />}
        onClick={() => cancelEditing('name')}
        sx={{ borderRadius: 2 }}
      >
        Cancel
      </Button>
      <Button
        variant="contained"
        size="small"
        startIcon={<SaveIcon />}
        onClick={async () => {
          if ((tempUserData.first_name && tempUserData.first_name !== userData.first_name) ||
              (tempUserData.last_name && tempUserData.last_name !== userData.last_name)) {
            const success = await saveName(tempUserData.first_name, tempUserData.last_name);
            if (success) {
              cancelEditing('name');
            }
          } else {
            cancelEditing('name');
          }
        }}
        sx={{ borderRadius: 2 }}
      >
        Save
      </Button>
    </Box>
  </div>
)}
