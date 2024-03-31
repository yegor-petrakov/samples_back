const database = require('../config/dbConn')

// @desc Get all codes in vaults
// @route GET /codesinvaults
// @access Private
const getAllCodesInVaults = async (req, res) => {

    const codesInVaults = await database.query(`SELECT * FROM codes_in_vaults`)

    if (codesInVaults.rowCount === 0) {
        return res.status(400).json({ message: 'No relations between codes and vaults found' })
    }

    res.json(codesInVaults.rows)
}

// @desc Put a new code into the vault
// @route POST /codesinvaults
// @access Private
const createNewCodeInVault = async (req, res) => {
    const { code_id, vault_id } = req.body

    // Confirm data
    if (!code_id && !vault_id) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Create and store new code in the vault
    const newCodeInVault = await database.query('INSERT INTO codes_in_vaults (code_id, vault_id) VALUES ($1, $2) RETURNING *', [code_id, vault_id])

    if (newCodeInVault) { //created 
        res.status(201).json({ message: `New code was put into vault` })
    } else {
        res.status(400).json({ message: 'Invalid data received' })
    }
}

// @desc Delete a relation
// @route DELETE /codesinvaults
// @access Private
const deleteCodeInVault = async (req, res) => {
    const { id } = req.body;

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'ID Required' });
    }

    const codeInVaultRelation = await database.query('SELECT * FROM codes_in_vaults WHERE id=$1;', [id]);

    // Does the user exist to delete?

    if (codeInVaultRelation.rowCount === 0) {
        return res.status(400).json({ message: 'Relation not found' });
    }

    const result = await database.query('DELETE FROM codes_in_vaults WHERE id=$1 RETURNING *', [id]);

    const reply = `Relation deleted`;

    res.json(reply);
};

module.exports = {
    getAllCodesInVaults,
    createNewCodeInVault,
    deleteCodeInVault
};
