<?php
    if (isset($_POST["key"])) {
        $key = $_POST["key"];
        
        // Replace with MySQL query
        echo json_encode(($key == "41fbb408-24cc-6e19-25e1-ebc3edc29bbf"));
    }
