var a = [5,4,3,2,1];

var x = Number.MAX_VALUE, y = Number.MAX_VALUE, z = Number.MAX_VALUE;
var t = 0, q = 0;


x = a[0];
y = b[1];
z = c[2];

for(var i = 3; i < a.length; ++i)
{
	if(a[i] < x)
	{
		t = x;
		x = a[i];
		if(t < y)
		{
			q = y;
			y = t;
			if(q < z)
			{
				z = q;
			}
		}
	}
}

console.log(x);
console.log(y);
console.log(z);


// if(a[i] < z) z = a[i];
// if(z < y) y = z;
// if(y < x) x = y;


// if(!x)
// {
// 	x = a[i];
// }

// if(a[i] < x)
// {
// 	t = x;
// 	x = a[i];
// 	if(t < y)
// 	{
// 		q = y;
// 		y = t;
// 		if(q < z)
// 		{
// 			z = q;
// 		}
// 	}
// }