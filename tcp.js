var net = require('net');


function getSocketType(socket)
{
	var s_type = socket.toString('utf8', 0, 5);
	
	if (s_type == 'FOTO ') 
		return 'F';

	if (s_type == 'INFO ') 
		return 'I';

	return 'E';
}

function getSocketTypePartial(socket)
{
	var ret = false;

	if (socket.length == 1)
	{
		if (socket.toString() == 'F')
			ret = true;
		if (socket.toString() == 'I')
			ret = true;
	}
	if (socket.length == 2)
	{
		if (socket.toString() == 'FO')
			ret = true;
		if (socket.toString() == 'IN')
			ret = true;
	}
	if (socket.length == 3)
	{
		if (socket.toString() == 'FOT')
			ret = true;
		if (socket.toString() == 'INF')
			ret = true;
	}
	if (socket.length == 4)
	{
		if (socket.toString() == 'FOTO')
			ret = true;
		if (socket.toString() == 'INFO')
			ret = true;
	}
	if (socket.length == 5)
	{
		if (socket.toString() == 'FOTO ')
			ret = true;
		if (socket.toString() == 'INFO ')
			ret = true;
	}
	return ret;
}


var server = net.createServer(function(socket) {

	var g_buffer, 
		g_process, 
		g_type, 
		g_token,
		robot_login,
		robot_login_text, 
		robot_pass, 
		semiR, semiN, 
		photo_size, 
		photo_content, 
		photo_checksum,
		photo_spaces,
		r_process,
        full_size,
        collison_visited;
	// g_process: 0 - prebieha login, 1 - prebieha zadavanie hesla, 2-?? - INFO/FOTO message

	semiR = false;
	semiN = false;
	g_type = 'E';
	g_process = 0;
	g_token = 0;
	r_process = 0;
	photo_size = 0;
	photo_spaces = 0;
	photo_content = 0;
	photo_checksum = '';
	robot_login_text = '';
	robot_login = 0;
    full_size = 0;
    g_buffer = new Buffer(0);

    var checksum_counter = 0;

	if (g_process == 0) 
				socket.write('200 LOGIN\r\n');

	socket.setTimeout(45000, function(){

		  socket.write('502 TIMEOUT\r\n');
		  socket.end();
		  socket.destroy();
		  return;

	});

	
	socket.on('data', function(data)
	{

		var temp = new Buffer(data, 'utf8');
		g_buffer = Buffer.concat([g_buffer, temp]);

		do {
			if (g_process == 0) 
				{
					if (g_buffer[g_token] == 13)
						semiR = true;
					if (g_buffer[g_token] == 10)
                        if (g_buffer[g_token-1] == 13)
				            semiN = true;
    
				    robot_login += g_buffer[g_token]; 

				    robot_login_text = g_buffer.toString('utf8', 0, 5);   

					if (semiN && semiR)
					{
						robot_login -= 23; // cistim login od koncoveho newlinu

						g_buffer = g_buffer.slice(g_token + 1); // skracujem g_buffer
						g_token = -1; // resetujem g_token
						semiR = false; // nastavujem flag R na nenajdeny
						semiN = false; // nastavujem flag N na nenajdeny
						g_process++; // upozornujem na novy proces
						//console.log('Emit loginu: ' + robot_login);
						socket.write('201 PASSWORD\r\n'); // emitujem spravu o zadani hesla
					}


				}
			else	
			if (g_process == 1) 
				{
					if (g_buffer[g_token] == 13)
						semiR = true;
					if (g_buffer[g_token] == 10)
                        if (g_buffer[g_token-1] == 13)
				            semiN = true;
    
					if (semiN && semiR)
					{
						robot_pass = g_buffer.toString('utf8', 0, g_token - 1);

						if (robot_login_text != 'Robot') {
							socket.write('500 LOGIN FAILED\r\n'); // emitujem spravu o nespravnom hesle
							socket.end(); // zakoncim socket
							socket.destroy(); // znicim socket
							return;
						};

						if (robot_pass == robot_login) {
							socket.write('202 OK\r\n'); // emitujem spravu o prijati hesla
						}else{
							socket.write('500 LOGIN FAILED\r\n'); // emitujem spravu o nespravnom hesle
							socket.end(); // zakoncim socket
							socket.destroy(); // znicim socket
							return;
						}

						g_buffer = g_buffer.slice(g_token + 1); // skracujem g_buffer
						g_token = -1; // resetujem g_token
						semiR = false; // nastavujem flag R na nenajdeny
						semiN = false; // nastavujem flag N na nenajdeny
						g_process++; // upozornujem na novy proces
					}


			}	
			else	
			if (g_process > 1)
				{
					if (g_type == 'E')
					{
						if (g_buffer.length > 5) {
							g_type = getSocketType(g_buffer);
							r_process = 0;
							if (g_type == 'E')
							{
								socket.write('501 SYNTAX ERROR\r\n'); // emitujem spravu o syntax errore
								socket.end(); // zakoncim socket
								socket.destroy(); // znicim socket
								return;
							}
						}else{
							if (!getSocketTypePartial(g_buffer)) {
								socket.write('501 SYNTAX ERROR\r\n'); // emitujem spravu o syntax errore
								socket.end(); // zakoncim socket
								socket.destroy(); // znicim socket
								return;
							};
						}
					} 

					if (g_type == 'I') 
					{
						//console.log('Citam znak INFO: ' + g_buffer[g_token]);
						if (g_buffer[g_token] == 13)
							semiR = true;
						if (g_buffer[g_token] == 10)
                        	if (g_buffer[g_token-1] == 13)
				            	semiN = true;

						if (semiN && semiR)
						{
							g_buffer = g_buffer.slice(g_token + 1); // skracujem g_buffer
							g_token = -1; // resetujem g_token
							semiR = false; // nastavujem flag R na nenajdeny
							semiN = false; // nastavujem flag N na nenajdeny
							g_process++; // upozornujem na novy proces
							//console.log('Správa info načítaná');
							socket.write('202 OK\r\n'); // emitujem spravu o zadani hesla
							g_type = 'E';
						}

						
					};

					if (g_type == 'F') 
					{


						if ((g_buffer[g_token] == 32) && (photo_spaces < 2))
                        {
							photo_spaces++;
                        }
						else
						{
							if (photo_spaces == 1)
							{
								photo_size *= 10;
                                
                                if (!(g_buffer[g_token].toString(16) == parseInt(g_buffer[g_token].toString(16))))
                                {
                                    socket.write('501 SYNTAX ERROR\r\n'); // emitujem spravu o syntax errore
								    socket.end(); // zakoncim socket
								    socket.destroy(); // znicim socket
								    return;
                                }
                                
								photo_size += parseInt(String.fromCharCode(g_buffer[g_token]));
	
								full_size = photo_size;
								console.log('Velkost fotky: ' + full_size);
							}
							
				            if ((photo_spaces == 2) && (full_size > 0)) 
							{
								full_size--;
                                console.log(full_size);
								photo_content += g_buffer[g_token];
							}else
							if (photo_spaces == 2) {


									checksum_counter++;
									photo_checksum += g_buffer[g_token].toString(16);
                                
									if (checksum_counter == 4) {
										

										if ( photo_content == parseInt(photo_checksum, 16)) {
											socket.write('202 OK\r\n');
										}else{
											socket.write('300 BAD CHECKSUM\r\n');
										}
		
										
                        		    	photo_content = 0;
                        		    	photo_checksum = '';
                        		    	g_buffer = g_buffer.slice(g_token + 1); // skracujem g_buffer
										g_token = -1; // resetujem g_token
										g_process++; // upozornujem na novy proces
										photo_spaces = 0;
										checksum_counter = 0;
                                        photo_size = 0;
                                        full_size = 0;
                                        g_type = 'E';
									};
							};

							





						}


					};
				}

			g_token++;
		}while(g_token < g_buffer.length)

			
	}
	);
});
 
server.listen(3001,'localhost');
