const database = require('../config/dbConn')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// @desc Login
// @route POST /auth
// @access Public
const login = async (req, res) => {
    const { username, password } = req.body

    console.log(username, password)

    if (!username || !password) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    const foundUser = await database.query('SELECT * FROM users WHERE username=$1', [username])

    if (foundUser.rowCount === 0) {
        return res.status(401).json({ message: 'Unauthorized (1)' })
    }

    const match = await bcrypt.compare(password, foundUser.rows[0].password)
    // const match = foundUser.rows[0].password === password

    if (!match) return res.status(401).json({ message: 'Unauthorized (2)' })

    const accessToken = jwt.sign(
        {
            "UserInfo": {
                "username": foundUser.rows[0].username,
                "role": foundUser.rows[0].role
            }
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
        { "username": foundUser.rows[0].username },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '7d' }
    )

    // Create secure cookie with refresh token 
    res.cookie('jwt', refreshToken, {
        httpOnly: true, //accessible only by web server 
        secure: true, //https
        sameSite: 'None', //cross-site cookie 
        maxAge: 7 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
    })

    // Send accessToken containing username and role
    res.json({ accessToken })
}

// @desc Refresh
// @route GET /auth/refresh
// @access Public - because access token has expired
const refresh = (req, res) => {
    const cookies = req.cookies

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized (3)' })

    const refreshToken = cookies.jwt

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' })

            const foundUser = await database.query('SELECT * FROM users WHERE username=$1', [decoded.username])

            if (foundUser.rowCount === 0) return res.status(401).json({ message: 'Unauthorized (4)' })

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": foundUser.rows[0].username,
                        "role": foundUser.rows[0].role
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            )

            res.json({ accessToken })
        }
    )
}

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
    const cookies = req.cookies
    if (!cookies?.jwt) return res.sendStatus(204) //No content
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true })
    res.json({ message: 'Cookie cleared' })
}

module.exports = {
    login,
    refresh,
    logout
}