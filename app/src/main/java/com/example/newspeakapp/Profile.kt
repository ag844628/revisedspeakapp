package com.example.newspeakapp

data class Profile(
    val id: Int,
    val name: String,
    val gender: String, // "Male" किंवा "Female"
    val age: String,
    val profession: String,
    val relationship: String,
    val audioUri: String? = null // युजरने अपलोड केलेली किंवा रेकॉर्ड केलेली ऑडिओ फाईल
)
